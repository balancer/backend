import { Chain } from '@prisma/client';
import { V3JoinedSubgraphPool, ViemClient } from '../../../sources/types';
import { poolUpsertTransformerV3 } from '../../../sources/transformers/pool-upsert-transformer-v3';
import { prisma } from '../../../../prisma/prisma-client';
import { enrichPoolUpsertsUsd } from '../../../sources/enrichers';
import _ from 'lodash';
import { fetchPoolSyncData } from '../../../sources/contracts/v3/fetch-pool-sync-data';
import { mergeArraysById } from '../../../helper/merge-arrays-by-id';

export const addPools = async (
    subgraphPools: V3JoinedSubgraphPool[],
    viemClient: ViemClient,
    vault: string,
    chain: Chain,
    blockNumber: number,
) => {
    const data = subgraphPools.map((fragment) => poolUpsertTransformerV3(fragment, chain, blockNumber));

    // Add onchain data to subgraph data
    const onchainData = await fetchPoolSyncData(
        viemClient,
        vault,
        data.map(({ pool: { id, type, hook } }) => ({ id, type, hook })),
        BigInt(blockNumber),
    );

    const inserts = data.map((item) => _.mergeWith(item, onchainData[item.pool.id], mergeArraysById));

    // USD Pricing
    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain: chain,
                tokenAddress: { in: inserts.flatMap((item) => item.tokens).map((token) => token.address) },
            },
        })
        .then((priceData) => Object.fromEntries(priceData.map((price) => [price.tokenAddress, price.price])));

    const withUsd = inserts.map((item) => enrichPoolUpsertsUsd<typeof item>(item, prices));

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
