import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3SubgraphClient } from '@modules/subgraphs/balancer-v3-vault';
import { poolTransformer, poolTokensTransformer } from '@modules/sources/transformers';
import { fetchErc20Headers, fetchWeightedPoolData, fetchPoolTokens } from '@modules/sources/contracts';
import type { ViemClient } from 'modules/sources/types';

/**
 * Makes sure that all pools are synced in the database
 *
 * @param subgraphClient
 * @param chain
 * @returns syncedPools - the pools that were synced
 */
export async function syncPools(
    subgraphClient: Pick<V3SubgraphClient, 'Pools'>,
    viemClient: ViemClient,
    vaultAddress: string,
    chain = 'SEPOLIA' as Chain,
) {
    // Fetch pools from subgraph
    const { pools: subgraphPools } = await subgraphClient.Pools();

    // Find pools missing from the database
    const dbPools = await prisma.prismaPool.findMany({ where: { chain, vaultVersion: 3 } });
    const dbPoolIds = new Set(dbPools.map((pool) => pool.id.toLowerCase()));
    const subgraphPoolIds = subgraphPools.map((pool) => pool.id.toLowerCase());
    const missingPools = subgraphPoolIds.filter((id) => !dbPoolIds.has(id));

    if (missingPools.length === 0) {
        return true;
    }

    // Fetch additional data from contracts required in the DB for missing pools
    const contractData = await fetchErc20Headers(missingPools as `0x${string}`[], viemClient);
    const poolTokens = subgraphPools.filter((pool) => !dbPoolIds.has(pool.id)).flatMap((pool) => pool.tokens ?? []);

    // Fetch pool type specific data
    // TODO: this will be covert by the subgraph, but in the meantime we need to fetch it from the contracts
    const weightedPoolData = await fetchWeightedPoolData(missingPools, viemClient);

    // TODO: this fails for now, there is something wrong with the ABI, or vault contract
    const poolTokenInfo = await fetchPoolTokens(vaultAddress, missingPools, viemClient);

    // Check if we need to get token information from the contracts as well
    const tokenAddresses = poolTokens.map((token) => token.address);
    const dbTokens = await prisma.prismaToken.findMany({ where: { address: { in: tokenAddresses }, chain } });
    const missingTokens = tokenAddresses.filter((address) => !dbTokens.some((token) => token.address === address));
    const tokenData = await fetchErc20Headers(missingTokens as `0x${string}`[], viemClient);

    // console.log(poolTokenInfo, weightedPoolData, contractData, tokenData);
    // Store pool tokens and BPT in the tokens table before creating the pools
    try {
        const allTokens = Object.entries({ ...tokenData, ...contractData }).map(([address, token]) => ({
            ...token,
            address,
        }));

        await prisma.prismaToken.createMany({
            data: allTokens.map((data) => ({ ...data, chain })),
            skipDuplicates: true,
        });
    } catch (e) {
        console.error('Error creating tokens', e);
    }

    // Transform pool data for the database
    const dbPoolEntries = missingPools
        .map((id) => {
            const subgraphPool = subgraphPools.find((pool) => pool.id === id);
            const data = contractData[id];
            if (!subgraphPool || !data) {
                // That won't happen, but TS doesn't know that
                return null;
            }
            return {
                ...poolTransformer(subgraphPool, data, chain),
                typeData: JSON.stringify({}),
                tokens: {
                    createMany: {
                        // TODO: Will be great to create all the token data here, including dynamic data
                        // but for now we can only store static data, because prisma doesn't support nested createMany
                        // to create dynamic data tabels as well. One solution is to move "dynamicData" to the tokens table
                        data: poolTokensTransformer(subgraphPool),
                    },
                },
                dynamicData: {
                    create: {
                        id: subgraphPool.id,
                        swapFee: '0',
                        blockNumber: Number(subgraphPool.blockNumber),
                        swapEnabled: true,
                        totalLiquidity: 1,
                        totalShares: '1', // TODO: update once we get the value from SG: subgraphPool.totalShares,
                        totalSharesNum: 1, // TODO: update once we get the value from SG: subgraphPool.totalShares,
                    },
                },
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // Store missing pools in the database
    let allOk = true;
    for (const data of dbPoolEntries) {
        try {
            console.log('Storing', data.id);
            const weightedData = weightedPoolData[data.id];
            // poolTokenInfo is failing for now, there is something wrong with the ABI, or vault contract
            // Once that is fixed, get the token balances in place
            const poolData = poolTokenInfo[data.id];
            await prisma.prismaPool.create({ data });
            // Create pool tokens dynamic data
            await prisma.prismaPoolTokenDynamicData.createMany({
                data: data.tokens.createMany.data.map((token, i) => {
                    return {
                        id: token.id,
                        poolTokenId: token.id,
                        chain,
                        blockNumber: data.dynamicData.create.blockNumber,
                        balance: '0',
                        balanceUSD: 0,
                        priceRate: '0',
                        weight: weightedData.weights[token.index] ?? '0',
                        latestFxPrice: null,
                    };
                }),
            });
        } catch (e) {
            // TODO: handle errors
            console.error(`Error creating pool ${data.id}`, e);
            allOk = false;
        }

        // Create pool tokens – something to talk about if we want to do it here on write, or on read
        // Pool queries fail without excplicitly creating the nested tokens relation
        await prisma.prismaPoolExpandedTokens.createMany({
            skipDuplicates: true,
            data: data.tokens.createMany.data.map((token) => ({
                poolId: data.id,
                chain: chain,
                tokenAddress: token.address,
                nestedPoolId: token.nestedPoolId || null,
            })),
        });
    }

    return allOk;
}
