import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { onchainPoolUpdate } from '../../sources/transformers/onchain-pool-update';
import { poolUpsertsUsd } from '../../sources/enrichers/pool-upserts-usd';
import type { VaultClient } from '../../sources/contracts';

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, poolTokenDynamicData, expandedToken tables
 *
 * @param ids - The pool ids to sync
 * @param vaultClient
 * @param chain
 * @param blockNumber
 */
export const syncPools = async (
    ids: string[],
    vaultClient: VaultClient,
    chain = 'SEPOLIA' as Chain,
    blockNumber: bigint,
) => {
    // Enrich with onchain data for all the pools
    const onchainData = await vaultClient.fetchPoolData(ids, blockNumber);

    // Needed to get the token decimals for the USD calculations,
    // Keeping it external, because we fetch these tokens in the upsert pools function
    const allTokens = await prisma.prismaToken.findMany({
        where: {
            chain: chain,
        },
    });

    // Get the data for the tables about pools
    const dbUpdates = Object.keys(onchainData).map((id) =>
        onchainPoolUpdate(onchainData[id], allTokens, chain, id, blockNumber),
    );

    const poolsWithUSD = await poolUpsertsUsd(dbUpdates, chain, allTokens);

    // Update pools data to the database
    for (const { poolDynamicData, poolTokenDynamicData } of poolsWithUSD) {
        try {
            await prisma.prismaPoolDynamicData.update({
                where: {
                    poolId_chain: {
                        poolId: poolDynamicData.poolId,
                        chain: poolDynamicData.chain,
                    },
                },
                data: poolDynamicData,
            });

            for (const tokenUpdate of poolTokenDynamicData) {
                await prisma.prismaPoolTokenDynamicData.update({
                    where: {
                        id_chain: {
                            id: tokenUpdate.id,
                            chain: tokenUpdate.chain,
                        },
                    },
                    data: tokenUpdate,
                });
            }
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return ids;
};
