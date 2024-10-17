import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchCowAmmData } from '../../sources/contracts';
import { poolDynamicDataUpsertsUsd } from '../../sources/enrichers/pool-upserts-usd';
import type { ViemClient } from '../../sources/types';
import { onchainCowAmmPoolUpdate } from '../../sources/transformers/onchain-pool-update';

/**
 * Gets a list of pool ids and fetches the onchain data then upserts into the database.
 *
 * @param ids List of pool ids to fetch and upsert
 * @param viemClient
 * @param chain
 * @param blockNumber
 */
export const syncPools = async (ids: string[], viemClient: ViemClient, chain: Chain, blockNumber: bigint) => {
    // Get onchain data for the pools
    const onchainData = await fetchCowAmmData(ids, viemClient, blockNumber);

    // Needed to get the token decimals for the USD calculations,
    // Keeping it external, because we fetch these tokens in the upsert pools function
    const allTokens = await prisma.prismaToken.findMany({
        where: {
            chain: chain,
        },
    });

    // Get the data for the tables about pools
    const dbPools = ids.map((id) => onchainCowAmmPoolUpdate(onchainData[id], allTokens, chain, id, blockNumber));
    const poolsWithUSD = await poolDynamicDataUpsertsUsd(dbPools, chain, allTokens);

    // Upsert RPC data to the database
    // Update pools data to the database
    for (const { poolDynamicData, poolTokenDynamicData } of poolsWithUSD) {
        try {
            await prisma.prismaPoolDynamicData.update({
                where: {
                    poolId_chain: {
                        poolId: poolDynamicData.id,
                        chain: chain,
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
    return true;
};
