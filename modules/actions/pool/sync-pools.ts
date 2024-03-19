import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchPoolData } from '../../sources/contracts/fetch-pool-data';
import { ViemClient } from '../../sources/viem-client';
import { onchainPoolUpdate } from '../../sources/transformers/onchain-pool-update';
import { poolUpsertsUsd } from '../../sources/enrichers/pool-upserts-usd';
import { fetchTokenPairData } from '../../sources/contracts/fetch-tokenpair-data';

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, poolTokenDynamicData, expandedToken tables
 *
 * @param subgraphPools
 * @param viemClient
 * @param vaultAddress
 * @param chain
 * @param blockNumber
 */
export const syncPools = async (
    ids: string[],
    viemClient: ViemClient,
    vaultAddress: string,
    routerAddress: string,
    chain = 'SEPOLIA' as Chain,
    blockNumber: bigint, // TODO: deprecate since we are using always the latest block
) => {
    // Enrich with onchain data for all the pools
    const onchainData = await fetchPoolData(vaultAddress, ids, viemClient, blockNumber);

    // Enrich with onchain tokenpair data for all the pools
    const tokenPairInputPools = await prisma.prismaPool.findMany({
        where: {
            id: { in: ids },
            chain: chain,
        },
        include: {
            tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true, token: true } },
            dynamicData: true,
        },
    });
    const tokenPairData = await fetchTokenPairData(routerAddress, tokenPairInputPools, viemClient);

    // Get the data for the tables about pools
    const dbUpdates = Object.keys(onchainData).map((id) =>
        onchainPoolUpdate(onchainData[id], tokenPairData[id].tokenPairs, Number(blockNumber), chain, id),
    );

    // Needed to get the token decimals for the USD calculations,
    // Keeping it external, because we fetch these tokens in the upsert pools function
    const allTokens = await prisma.prismaToken.findMany({
        where: {
            chain: chain,
        },
    });

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
