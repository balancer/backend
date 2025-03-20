import { Chain } from '@prisma/client';
import { V3JoinedSubgraphPool } from '../../../sources/types';
import { poolUpsertTransformerV3 } from '../../../sources/transformers/pool-upsert-transformer-v3';
import { prisma } from '../../../../prisma/prisma-client';
import { enrichPoolUpsertsUsd } from '../../../sources/enrichers';
import { PoolsClient, VaultClient } from '../../../sources/contracts';
import { fetchHookData } from '../../../sources/contracts/v3/fetch-hook-data';
import _ from 'lodash';

export const addPools = async (
    subgraphPools: V3JoinedSubgraphPool[],
    vaultClient: VaultClient,
    poolsClient: PoolsClient,
    chain: Chain,
    blockNumber: number,
) => {
    const data = subgraphPools.map((fragment) => poolUpsertTransformerV3(fragment, chain, blockNumber));

    // Add onchain data to subgraph data
    const poolIds = data.map((item) => item.pool.id);
    const [onchainData, poolTypeData, hookData] = await Promise.all([
        vaultClient.fetchPoolData(poolIds, BigInt(blockNumber)),
        poolsClient.fetchPoolTypeData(
            data.map((item) => ({ id: item.pool.id, type: item.pool.type })),
            BigInt(blockNumber),
        ),
        fetchHookData(
            vaultClient.viemClient,
            data
                .filter((item) => item.pool.hook && item.pool.hook.type !== null)
                .map((item) => ({ address: item.pool.address, hook: item.pool.hook! })),
        ).then((data) =>
            Object.fromEntries(
                Object.entries(data).map(([k, v]) => [
                    k.toLowerCase(),
                    {
                        pool: {
                            hook: {
                                dynamicData: v,
                            },
                        },
                    },
                ]),
            ),
        ),
    ]);

    const inserts = data.map((item) =>
        _.mergeWith(
            item,
            onchainData[item.pool.id],
            poolTypeData[item.pool.id],
            hookData[item.pool.address],
            mergeArraysById,
        ),
    );

    // USD Pricing
    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain: chain,
                tokenAddress: { in: inserts.flatMap((item) => item.tokens).map((token) => token.address) },
            },
        })
        .then((priceData) => Object.fromEntries(priceData.map((price) => [price.tokenAddress, price.price])));

    const withUsd = inserts.map((item) => enrichPoolUpsertsUsd(item, prices));

    // Upsert pools to the database
    for (const { pool, tokens, poolToken, poolDynamicData, poolExpandedTokens } of withUsd) {
        try {
            await prisma.$transaction([
                prisma.prismaPool.upsert({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    create: pool,
                    update: pool,
                }),
                ...((poolDynamicData && [
                    prisma.prismaPoolDynamicData.upsert({
                        where: { poolId_chain: { poolId: pool.id, chain: pool.chain } },
                        create: {
                            ...poolDynamicData,
                            id: pool.id,
                            pool: {
                                connect: {
                                    id_chain: {
                                        id: pool.id,
                                        chain: pool.chain,
                                    },
                                },
                            },
                        },
                        update: poolDynamicData,
                    }),
                ]) ||
                    []),
                ...((tokens &&
                    tokens.map((token) =>
                        prisma.prismaToken.upsert({
                            where: { address_chain: { address: token.address, chain } },
                            create: {
                                ...token,
                                chain,
                            },
                            update: token,
                        }),
                    )) ||
                    []),
                ...((poolToken &&
                    poolToken.map((token) =>
                        prisma.prismaPoolToken.upsert({
                            where: { id_chain: { id: token.id, chain } },
                            create: {
                                ...token,
                                poolId: pool.id,
                                chain,
                            },
                            update: token,
                        }),
                    )) ||
                    []),
                ...((poolExpandedTokens &&
                    poolExpandedTokens.map((token) =>
                        prisma.prismaPoolExpandedTokens.upsert({
                            where: {
                                tokenAddress_poolId_chain: {
                                    tokenAddress: token.tokenAddress,
                                    poolId: pool.id,
                                    chain,
                                },
                            },
                            create: token,
                            update: token,
                        }),
                    )) ||
                    []),
            ]);
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return withUsd;
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
