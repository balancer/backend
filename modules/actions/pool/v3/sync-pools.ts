import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { HookData } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { enrichPoolUpsertsUsd } from '../../../sources/enrichers/pool-upserts-usd';
import _ from 'lodash';
import { fetchPoolSyncData } from '../../../sources/contracts/v3/fetch-pool-sync-data';
import { ViemClient } from '../../../sources/viem-client';
import { mergeArraysById } from '../../../helper/merge-arrays-by-id';

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, expandedToken tables
 *
 * @param subgraphPools
 * @param vaultClient
 * @param chain
 * @param blockNumber
 */
export const syncPools = async (
    dbPools: { id: string; type: PrismaPoolType; hook?: HookData; typeData: any }[],
    chain: Chain,
    vault: string,
    viemClient: ViemClient,
    blockNumber: number,
) => {
    const poolIds = dbPools.map((pool) => pool.id);

    const onchainData = await fetchPoolSyncData(viemClient, vault, dbPools, BigInt(blockNumber));

    const upserts = dbPools.map((pool) => _.mergeWith({ pool }, onchainData[pool.id], mergeArraysById));

    // USD Pricing
    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain: chain,
                tokenAddress: {
                    in: Object.values(onchainData)
                        .flatMap((item) => item.poolToken)
                        .map((token) => token.address),
                },
            },
        })
        .then((priceData) => Object.fromEntries(priceData.map((price) => [price.tokenAddress, price.price])));

    // Organize the data into upserts
    const withUsd = upserts.map((item) => enrichPoolUpsertsUsd<typeof item>(item, prices));

    // Upsert pools to the database in batches
    for (const { pool, poolToken, poolDynamicData } of withUsd) {
        try {
            await prisma.$transaction([
                ...((pool && [
                    prisma.prismaPool.update({
                        where: { id_chain: { id: pool.id, chain } },
                        data: pool as Prisma.PrismaPoolUpdateInput,
                    }),
                ]) ||
                    []),
                ...((poolDynamicData && [
                    prisma.prismaPoolDynamicData.update({
                        where: { poolId_chain: { poolId: pool.id, chain } },
                        data: {
                            ...poolDynamicData,
                            protocolSwapFee: poolDynamicData.aggregateSwapFee,
                            protocolYieldFee: poolDynamicData.aggregateYieldFee,
                        },
                    }),
                ]) ||
                    []),
                ...((poolToken &&
                    poolToken.map((token) =>
                        prisma.prismaPoolToken.update({
                            where: { id_chain: { id: token.id, chain } },
                            data: token,
                        }),
                    )) ||
                    []),
            ]);
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return poolIds;
};
