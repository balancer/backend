import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { HookData } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
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
    dbPools: {
        id: string;
        type: PrismaPoolType;
        hook?: HookData;
        typeData: any;
        tokens: { address: string; decimals: number }[];
    }[],
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

    upserts.forEach((pool) => {
        pool.poolToken = pool.poolToken.map((pt) => ({
            ...pt,
            balanceUSD: parseFloat(pt.balance) * prices[pt.address] || 0,
        }));
        pool.poolDynamicData = {
            ...pool.poolDynamicData,
            totalLiquidity: pool.poolToken.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
        };
    });

    // Upsert pools to the database in batches
    for (const { pool, poolToken, poolDynamicData } of upserts) {
        try {
            await prisma.$transaction([
                ...((pool && [
                    prisma.prismaPool.update({
                        where: { id_chain: { id: pool.id, chain } },
                        data: {
                            hook: pool.hook,
                            typeData: pool.typeData,
                        },
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
                            data: {
                                balance: token.balance,
                                balanceUSD: token.balanceUSD,
                                priceRate: token.priceRate,
                            },
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
