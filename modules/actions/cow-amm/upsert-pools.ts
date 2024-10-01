import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchCowAmmData } from '../../sources/contracts';
import { poolUpsertsUsd } from '../../sources/enrichers/pool-upserts-usd';
import type { CowAmmSubgraphClient } from '../../sources/subgraphs';
import type { ViemClient } from '../../sources/types';
import { SubgraphPoolUpsertData, subgraphPoolUpsert } from '../../sources/transformers/subgraph-pool-upsert';
import { formatUnits } from 'viem';

/**
 * Gets a list of pool ids and fetches the data from the subgraph and rpc, and then upserts into the database.
 *
 * @param ids List of pool ids to fetch and upsert
 * @param viemClient
 * @param cowAmmSubgraphClient
 * @param chain
 */
export const upsertPools = async (
    ids: string[],
    viemClient: ViemClient,
    cowAmmSubgraphClient: CowAmmSubgraphClient,
    chain: Chain,
    blockNumber?: bigint,
) => {
    const pools = await cowAmmSubgraphClient.getAllPools({ id_in: ids });

    // Get onchain data for the pools
    const onchainData = await fetchCowAmmData(
        pools.map((pool) => pool.id),
        viemClient,
        blockNumber,
    );

    // Needed to get the token decimals for the USD calculations,
    // Keeping it external, because we fetch these tokens in the upsert pools function
    const allTokens = await prisma.prismaToken.findMany({
        where: {
            chain: chain,
        },
    });

    // Add tokens if any are missing in the DB
    const poolTokens = pools.flatMap((pool) => {
        return [
            ...pool.tokens.map((token) => ({
                address: token.address,
                decimals: token.decimals,
                name: token.name,
                symbol: token.symbol,
                chain: chain,
            })),
            {
                address: pool.id,
                decimals: 18,
                name: pool.name,
                symbol: pool.symbol,
                chain: chain,
            },
        ];
    });

    const missingTokens = poolTokens.filter(
        (poolToken) => !allTokens.find((token) => token.address === poolToken.address),
    );
    if (missingTokens.length > 0) {
        await prisma.prismaToken.createMany({
            data: missingTokens.map((token) => ({
                address: token.address,
                decimals: token.decimals,
                symbol: token.symbol,
                name: token.name,
                chain,
            })),
        });
    }

    // Get the data for the tables about pools
    // TODO: add cow amm to subgraph v3 transformer before passing to subgraphPoolUpsert
    const dbPools = pools
        .map((poolData) =>
            subgraphPoolUpsert(
                {
                    ...poolData,
                    factory: {
                        id: poolData.factory.id,
                        type: 'COW_AMM' as any,
                        version: 1,
                    },
                    address: poolData.id,
                    pauseManager: '',
                    rateProviders: poolData.tokens.map(({ address }) => ({
                        address: '0x0000000000000000000000000000000000000000',
                        token: { address },
                    })),
                    pauseWindowEndTime: '',
                    tokens: poolData.tokens.map((token) => ({
                        ...token,
                        totalProtocolSwapFee: '0',
                        totalProtocolYieldFee: '0',
                        paysYieldFees: false,
                    })),
                },
                {
                    ...onchainData[poolData.id],
                    isPoolPaused: false,
                    isPoolInRecoveryMode: false,
                    tokens: onchainData[poolData.id].tokens.map((token) => ({
                        ...token,
                        rateProvider: '',
                        rate: 1n,
                        paysYieldFees: false,
                        isErc4626: false,
                    })),
                },
                chain,
                blockNumber,
            ),
        )
        .filter((item): item is Exclude<SubgraphPoolUpsertData, null> => Boolean(item));

    const poolsWithUSD = await poolUpsertsUsd(dbPools, chain, allTokens);

    // Upserts pools to the database
    // TODO: extract to a DB helper
    for (const { pool, poolToken, poolDynamicData, poolTokenDynamicData, poolExpandedTokens } of poolsWithUSD) {
        try {
            await prisma.$transaction([
                prisma.prismaPool.upsert({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    create: pool,
                    update: pool,
                }),

                prisma.prismaPoolDynamicData.upsert({
                    where: { poolId_chain: { poolId: pool.id, chain: pool.chain } },
                    create: poolDynamicData,
                    update: poolDynamicData,
                }),

                // First nullify the pool tokens and then insert them again
                prisma.prismaPoolToken.deleteMany({ where: { poolId: pool.id } }),
                prisma.prismaPoolTokenDynamicData.deleteMany({ where: { poolTokenId: { startsWith: pool.id } } }),
                prisma.prismaPoolExpandedTokens.deleteMany({ where: { poolId: pool.id } }),

                prisma.prismaPoolToken.createMany({
                    data: poolToken,
                    skipDuplicates: true,
                }),

                prisma.prismaPoolTokenDynamicData.createMany({
                    data: poolTokenDynamicData,
                    skipDuplicates: true,
                }),

                prisma.prismaPoolExpandedTokens.createMany({
                    data: poolExpandedTokens,
                    skipDuplicates: true,
                }),
            ]);
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return ids;
};
