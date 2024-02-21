import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { poolTransformer, poolTokensTransformer, poolTokensDynamicDataTransformer } from '../../sources/transformers';
import { V3PoolsSubgraphClient } from '../../subgraphs/balancer-v3-pools';
import { V3SubgraphClient } from '../../subgraphs/balancer-v3-vault';
/**
 * Makes sure that all pools are synced in the database
 *
 * @param vaultSubgraphClient
 * @param poolSubgraphClient
 * @param chain
 * @returns syncedPools - the pools that were synced
 */
export async function addMissingPoolsFromSubgraph(
    vaultSubgraphClient: Pick<V3SubgraphClient, 'Pools'>,
    poolSubgraphClient: V3PoolsSubgraphClient,
    // viemClient: ViemClient,
    // vaultAddress: string,
    chain = 'SEPOLIA' as Chain,
) {
    // Fetch pools from subgraph
    // TODO this needs paging
    const { pools: vaultSubgraphPools } = await vaultSubgraphClient.Pools();
    const { pools: poolSubgraphPools } = await poolSubgraphClient.Pools();

    // Find pools missing from the database
    const dbPools = await prisma.prismaPool.findMany({ where: { chain, vaultVersion: 3 } });
    const dbPoolIds = new Set(dbPools.map((pool) => pool.id.toLowerCase()));
    const missingPools = vaultSubgraphPools.filter((pool) => !dbPoolIds.has(pool.id));

    if (missingPools.length === 0) {
        return true;
    }

    // Store pool tokens and BPT in the tokens table before creating the pools
    try {
        const allTokens: { address: string; name: string; decimals: number; symbol: string; chain: Chain }[] = [];
        missingPools.forEach((pool) => {
            allTokens.push({
                address: pool.address,
                decimals: 18,
                name: pool.name,
                symbol: pool.symbol,
                chain: chain,
            });
            if (pool.tokens) {
                for (const poolToken of pool.tokens) {
                    allTokens.push({
                        address: poolToken.address,
                        decimals: poolToken.decimals,
                        name: poolToken.name,
                        symbol: poolToken.symbol,
                        chain: chain,
                    });
                }
            }
        });

        await prisma.prismaToken.createMany({
            data: allTokens,
            skipDuplicates: true,
        });
    } catch (e) {
        console.error('Error creating tokens', e);
    }

    // Transform pool data for the database
    const dbPoolEntries = missingPools
        .map((missingPool) => {
            const vaultSubgraphPool = vaultSubgraphPools.find((pool) => pool.id === missingPool.id);
            const poolSubgraphPool = poolSubgraphPools.find((pool) => pool.id === missingPool.id);
            if (!vaultSubgraphPool || !poolSubgraphPool) {
                // That won't happen, but TS doesn't know that
                return null;
            }
            return {
                ...poolTransformer(vaultSubgraphPool, poolSubgraphPool, chain),
                typeData: JSON.stringify({}),
                tokens: {
                    createMany: {
                        // TODO: Will be great to create all the token data here, including dynamic data
                        // but for now we can only store static data, because prisma doesn't support nested createMany
                        // to create dynamic data tabels as well. One solution is to move "dynamicData" to the tokens table
                        data: poolTokensTransformer(vaultSubgraphPool),
                    },
                },
                dynamicData: {
                    create: {
                        id: vaultSubgraphPool.id,
                        swapFee: '0',
                        blockNumber: Number(vaultSubgraphPool.blockNumber),
                        swapEnabled: true,
                        totalLiquidity: 1,
                        totalShares: vaultSubgraphPool.totalShares,
                        totalSharesNum: parseFloat(vaultSubgraphPool.totalShares),
                    },
                },
                poolTokenDynamicData: poolTokensDynamicDataTransformer(vaultSubgraphPool, poolSubgraphPool, chain),
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // Store missing pools in the database
    let allOk = true;
    for (const data of dbPoolEntries) {
        try {
            await prisma.prismaPool.create({ data });
            // Create pool tokens dynamic data
            await prisma.prismaPoolTokenDynamicData.createMany({
                data: data.poolTokenDynamicData,
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
