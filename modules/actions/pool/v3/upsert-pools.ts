import { Chain, PrismaPool } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { enrichPoolUpsertsUsd } from '../../../sources/enrichers/pool-upserts-usd';
import { PoolsClient, type VaultClient } from '../../../sources/contracts';
import { fetchHookData } from '../../../sources/contracts/v3/fetch-hook-data';
import { HookData } from '../../../sources/transformers';
import _ from 'lodash';

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
export const upsertPools = async (
    dbPools: (PrismaPool & { hook?: HookData })[],
    vaultClient: VaultClient,
    poolsClient: PoolsClient,
    chain: Chain,
    blockNumber: number,
) => {
    const poolIds = dbPools.map((pool) => pool.id);

    // Fetch all necessary data in parallel
    const [onchainData, poolTypeData, hookData] = await Promise.all([
        vaultClient.fetchPoolData(poolIds, BigInt(blockNumber)),
        poolsClient.fetchPoolTypeData(dbPools, BigInt(blockNumber)),
        fetchHookData(
            vaultClient.viemClient,
            dbPools.filter((pool) => pool.hook && pool.hook.type !== null),
        ),
    ]);

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
    const upserts = dbPools.map((pool) => {
        const poolId = pool.id;
        const onchainPool = {
            ...onchainData[poolId],
            poolToken: onchainData[poolId].poolToken.map((token) => ({
                ...token,
                chain,
                poolId,
            })),
        };
        const typeData = poolTypeData[poolId]
            ? {
                  pool: { id: pool.id, typeData: poolTypeData[poolId] },
              }
            : undefined;
        const hookDynamicData = hookData[poolId]
            ? {
                  pool: {
                      id: pool.id,
                      hook: {
                          dynamicData: hookData[poolId],
                      },
                  },
              }
            : undefined;
        const usdData = enrichPoolUpsertsUsd(onchainPool, prices);

        const upsert = _.mergeWith(onchainPool, typeData, hookDynamicData, usdData, mergeArraysById);

        return upsert;
    });

    // Upsert pools to the database in batches
    for (const { pool, poolToken, poolDynamicData } of upserts) {
        try {
            await prisma.$transaction([
                ...((pool && [
                    prisma.prismaPool.update({
                        where: { id_chain: { id: pool.id, chain } },
                        data: pool,
                    }),
                ]) ||
                    []),
                ...((poolDynamicData && [
                    prisma.prismaPoolDynamicData.update({
                        where: { poolId_chain: { poolId: poolDynamicData.id, chain } },
                        data: poolDynamicData,
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

const mergeArraysById = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue)) {
        return _.unionBy(
            objValue.map((obj) => {
                const match = srcValue.find((src: any) => src.id === obj.id);
                return match ? _.merge({}, obj, match) : obj;
            }),
            srcValue,
            'id',
        );
    }
};
