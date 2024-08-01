import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { tokensTransformer } from '../../sources/transformers/tokens-transformer';
import { JoinedSubgraphPool } from '../../sources/subgraphs';
import { subgraphPoolUpsert, SubgraphPoolUpsertData } from '../../sources/transformers/subgraph-pool-upsert';
import { poolUpsertsUsd } from '../../sources/enrichers/pool-upserts-usd';
import type { VaultClient } from '../../sources/contracts';

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, poolTokenDynamicData, expandedToken tables
 *
 * @param subgraphPools
 * @param vaultClient
 * @param chain
 * @param blockNumber
 */
export const upsertPools = async (
    subgraphPools: JoinedSubgraphPool[],
    vaultClient: VaultClient,
    chain = 'SEPOLIA' as Chain,
    blockNumber: bigint,
) => {
    // Enrich with onchain data for all the pools
    const onchainData = await vaultClient.fetchPoolData(
        subgraphPools.map((pool) => pool.id),
        blockNumber,
    );

    // Store pool tokens and BPT in the tokens table before creating the pools
    const allTokens = tokensTransformer(subgraphPools, chain);
    try {
        await prisma.prismaToken.createMany({
            data: allTokens,
            skipDuplicates: true,
        });
    } catch (e) {
        console.error('Error creating tokens', e);
    }

    // Get the data for the tables about pools
    const dbPools = subgraphPools
        .map((poolData) => subgraphPoolUpsert(poolData, onchainData[poolData.id], chain, blockNumber))
        .filter((item): item is Exclude<SubgraphPoolUpsertData, null> => Boolean(item));

    // Enrich updates with USD values
    const poolsWithUSD = await poolUpsertsUsd(dbPools, chain, allTokens);

    // Upsert pools to the database
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

    return dbPools.map(({ pool }) => ({ id: pool.id, type: pool.type }));
};
