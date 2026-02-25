import { Chain, Prisma, PrismaPool, PrismaPoolSnapshot, PrismaPoolType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { getLastSyncedBlock } from '../last-synced-block';
import { eventsRepository } from '../../repositories/events';
import { now, roundToMidnight } from '../../common/time';
import { blockNumbers } from '../../block-numbers';
import { getViemClient } from '../../sources/viem-client';
import { formatEther, formatUnits, parseAbi } from 'viem/utils';
import config from '../../../config';

export async function reloadSnapshots(chain: Chain, poolId: string): Promise<void> {
    const pool = await prisma.prismaPool.findUniqueOrThrow({
        where: { id_chain: { id: poolId, chain } },
        select: {
            id: true,
            chain: true,
            createTime: true,
            protocolVersion: true,
            address: true,
            type: true,
            version: true,
            tokens: {
                select: { address: true, token: { select: { address: true, decimals: true } } },
            },
        },
    });

    const firstSnapshotTimestamp = roundToMidnight(pool.createTime) + 86400; // we take the day after creation
    const todayTimestamp = roundToMidnight(Math.floor(Date.now() / 1000));
    const daysSinceFirstSnapshot = Math.floor((todayTimestamp - firstSnapshotTimestamp) / 86400);
    const dailyBlocks = await blockNumbers().getDailyBlocks(chain, daysSinceFirstSnapshot);

    // for each day, calculate the snapshot
    const upsertSnapshots: Prisma.PrismaPoolSnapshotCreateInput[] = [];

    const totalSharesForBlocks: Record<number, string> = await getTotalSharesAtBlocks(pool, dailyBlocks);

    const poolTokensForBlocks: Record<number, { address: string; balance: string; index: number }[]> =
        await getPoolTokenBalancesAtBlocks(pool, dailyBlocks);

    const dailySwapsData = await eventsRepository.getDailySwapsStats(chain, firstSnapshotTimestamp, now(), [poolId]);

    // convert to map for easier access
    const swapsDataMap: Record<number, (typeof dailySwapsData)[0]> = {};
    dailySwapsData.forEach((data) => {
        swapsDataMap[data.timestamp] = data;
    });

    const bptPriceSinceFirstSnapshot = await prisma.prismaTokenPrice.findMany({
        where: {
            chain,
            tokenAddress: pool.address,
            timestamp: {
                gte: firstSnapshotTimestamp,
            },
        },
        select: { price: true, timestamp: true },
        orderBy: {
            timestamp: 'asc',
        },
    });

    for (const block of dailyBlocks) {
        const currentTimestamp = roundToMidnight(block.timestamp);
        const totalShares = totalSharesForBlocks[block.timestamp] ?? '0';

        // find closest bpt price, array is sorted timestamp asc
        const bptPriceAtTimestamp = bptPriceSinceFirstSnapshot.find(
            (price) => price.timestamp >= currentTimestamp,
        )?.price;

        const totalLiquidity = parseFloat(totalShares) * (bptPriceAtTimestamp ?? 0);

        upsertSnapshots.push({
            pool: {
                connect: { id_chain: { id: pool.id, chain } },
            },
            id: `${poolId}-${currentTimestamp}`,
            timestamp: currentTimestamp,
            protocolVersion: pool.protocolVersion,
            totalLiquidity: totalLiquidity,
            totalShares: totalShares || '0',
            totalSharesNum: parseFloat(totalShares || '0'),
            swapsCount: parseFloat(swapsDataMap[currentTimestamp]?.swapsCount?.toString()) || 0,
            volume24h: swapsDataMap[currentTimestamp]?.volume24h || 0,
            fees24h: swapsDataMap[currentTimestamp]?.fees24h || 0,
            surplus24h: swapsDataMap[currentTimestamp]?.surplus24h || 0,
            sharePrice:
                totalLiquidity > 0 && parseFloat(totalShares || '0') > 0
                    ? totalLiquidity / parseFloat(totalShares || '0')
                    : 0,
            amounts:
                poolTokensForBlocks[block.timestamp]?.sort((a, b) => a.index - b.index).map((pt) => pt.balance) || [],
        });
    }

    // Use upserts to sync snapshots into the DB
    const upserts = upsertSnapshots.map((snapshot) =>
        prisma.prismaPoolSnapshot.upsert({
            where: { id_chain: { id: snapshot.id, chain } },
            create: snapshot,
            update: snapshot,
        }),
    );

    // Execute upserts in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        const batch = upserts.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(batch);
    }
}

export async function syncSnapshots(chain: Chain): Promise<string[]> {
    // we only need the latest synced block to understand if we also need to complete yesterdays snapshot
    // if we crossed midnight since the last synced block, we need to sync yesterday as well to complete the snapshot
    const latestSyncedBlock = await getLastSyncedBlock(chain, 'SNAPSHOTS');
    const timestampForBlock = (await blockNumbers().getTimestamp(chain, latestSyncedBlock)) ?? 0;
    const shouldSyncYesterday = roundToMidnight(timestampForBlock) < roundToMidnight(Math.floor(Date.now() / 1000));

    // we always sync todays snapshot
    const upsertSnapshots: Prisma.PrismaPoolSnapshotCreateInput[] = [];
    const snapshotTimestampForToday = roundToMidnight(Math.floor(Date.now() / 1000));

    const poolsDynamicData = await prisma.prismaPoolDynamicData.findMany({
        where: {
            chain,
        },
        select: {
            poolId: true,
            totalLiquidity: true,
            totalShares: true,
            pool: {
                select: {
                    protocolVersion: true,
                },
            },
        },
    });

    const poolTokens = await prisma.prismaPoolToken.findMany({
        where: {
            poolId: { in: poolsDynamicData.map((p) => p.poolId) },
            chain,
        },
        select: { poolId: true, address: true, balance: true, index: true },
    });

    // create a map of poolId -> poolTokens
    const poolTokensMap: Record<string, { address: string; balance: string; index: number }[]> = {};
    poolTokens.forEach((pt) => {
        if (!poolTokensMap[pt.poolId]) {
            poolTokensMap[pt.poolId] = [];
        }
        poolTokensMap[pt.poolId].push({ address: pt.address, balance: pt.balance, index: pt.index });
    });

    const { upsertSnapshots: snapshotsToday, latestBlock } = await calculatePoolSnapshots(
        chain,
        poolsDynamicData,
        snapshotTimestampForToday,
        now(),
        poolTokensMap,
    );

    upsertSnapshots.push(...snapshotsToday);

    if (shouldSyncYesterday) {
        const snapshotTimestampForYesterday = snapshotTimestampForToday - 86400;
        const { upsertSnapshots: snapshotsYesterday } = await calculatePoolSnapshots(
            chain,
            poolsDynamicData,
            snapshotTimestampForYesterday,
            snapshotTimestampForToday,
            poolTokensMap,
        );
        upsertSnapshots.push(...snapshotsYesterday);
    }

    // Use upserts to sync snapshots into the DB
    const upserts = upsertSnapshots.map((snapshot) =>
        prisma.prismaPoolSnapshot.upsert({
            where: { id_chain: { id: snapshot.id, chain: chain } },
            create: snapshot,
            update: snapshot,
        }),
    );

    // Execute upserts in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        const batch = upserts.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(batch);
    }

    await prisma.prismaLastBlockSynced.upsert({
        where: { category_chain: { chain, category: 'SNAPSHOTS' } },
        create: { chain, category: 'SNAPSHOTS', blockNumber: latestBlock },
        update: { blockNumber: latestBlock },
    });

    return upsertSnapshots.map((snapshot) => snapshot.id);
}

async function calculatePoolSnapshots(
    chain: Chain,
    poolsDynamicData: {
        poolId: string;
        totalLiquidity: number;
        totalShares: string;
        pool: {
            protocolVersion: number;
        };
    }[],
    since: number,
    until: number,
    poolTokensMap: Record<string, { address: string; balance: string; index: number }[]>,
) {
    const poolIds = poolsDynamicData.map((p) => p.poolId);

    // convert to map for easier access
    const poolsDynamicDataMap: Record<string, (typeof poolsDynamicData)[0]> = {};
    poolsDynamicData.forEach((data) => {
        poolsDynamicDataMap[data.poolId] = data;
    });

    const swapStats = await eventsRepository.getDailySwapsStats(chain, since, until);

    let latestBlock = 0;
    // convert stats to map for easier access
    const statsMap: Record<string, (typeof swapStats)[0]> = {};
    swapStats.forEach((stat) => {
        statsMap[stat.poolId] = stat;
        latestBlock = Math.max(latestBlock, stat.latestBlockNumber);
    });

    const upsertSnapshots: Prisma.PrismaPoolSnapshotCreateInput[] = [];

    for (const poolId of poolIds) {
        if (!poolsDynamicDataMap[poolId]) continue; // skip if no dynamic data
        upsertSnapshots.push({
            pool: {
                connect: { id_chain: { id: poolId, chain } },
            },
            id: `${poolId}-${since}`,
            timestamp: since,
            protocolVersion: poolsDynamicDataMap[poolId].pool.protocolVersion || 2,
            totalLiquidity: poolsDynamicDataMap[poolId].totalLiquidity || 0,
            totalShares: poolsDynamicDataMap[poolId].totalShares || '0',
            totalSharesNum: parseFloat(poolsDynamicDataMap[poolId].totalShares || '0'),
            swapsCount: parseFloat(statsMap[poolId]?.swapsCount?.toString()) || 0,
            volume24h: statsMap[poolId]?.volume24h || 0,
            fees24h: statsMap[poolId]?.fees24h || 0,
            surplus24h: statsMap[poolId]?.surplus24h || 0,
            sharePrice:
                (poolsDynamicDataMap[poolId].totalLiquidity || 0) > 0 &&
                parseFloat(poolsDynamicDataMap[poolId].totalShares || '0') > 0
                    ? poolsDynamicDataMap[poolId].totalLiquidity /
                      parseFloat(poolsDynamicDataMap[poolId].totalShares || '0')
                    : 0,
            amounts: poolTokensMap[poolId]?.sort((a, b) => a.index - b.index).map((pt) => pt.balance) || [],
        });
    }
    return { upsertSnapshots, latestBlock };
}

async function getTotalSharesAtBlocks(
    pool: {
        id: string;
        chain: Chain;
        address: string;
        type: PrismaPoolType;
        version: number;
        protocolVersion: number;
    },
    blocks: { number: number; timestamp: number }[],
): Promise<Record<string, string>> {
    const client = getViemClient(pool.chain);
    const BATCH_SIZE = 100;

    const totalSharesMap: Record<string, string> = {};

    // Process blocks in batches
    for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
        const batch = blocks.slice(i, i + BATCH_SIZE);

        // Create a promise for each block in the batch
        const promises = batch.map(async (block) => {
            try {
                if (pool.protocolVersion === 2 || pool.protocolVersion === 1) {
                    let supplyFunction: 'getVirtualSupply' | 'getActualSupply' | 'totalSupply' = 'totalSupply';

                    if (pool.type === 'COMPOSABLE_STABLE' && pool.version === 0) {
                        supplyFunction = 'getVirtualSupply';
                    } else if (
                        pool.type === 'COMPOSABLE_STABLE' ||
                        (pool.type === 'WEIGHTED' && pool.version > 1) ||
                        (pool.type === 'UNKNOWN' && pool.version > 1)
                    ) {
                        supplyFunction = 'getActualSupply';
                    } else {
                        supplyFunction = 'totalSupply';
                    }

                    const result = await client.readContract({
                        address: pool.address as `0x${string}`,
                        abi: parseAbi([
                            'function getActualSupply() view returns (uint256)',
                            'function totalSupply() view returns (uint256)',
                            'function getVirtualSupply() view returns (uint256)',
                        ]),
                        functionName: supplyFunction,
                        blockNumber: BigInt(block.number),
                    });

                    return {
                        timestamp: block.timestamp,
                        value: formatEther(result as bigint),
                    };
                } else {
                    const result = await client.readContract({
                        address: config[pool.chain].balancer.v3.vaultAddress as `0x${string}`,
                        abi: parseAbi(['function totalSupply(address) view returns (uint256)']),
                        functionName: 'totalSupply',
                        blockNumber: BigInt(block.number),
                        args: [pool.address as `0x${string}`],
                    });

                    return {
                        timestamp: block.timestamp,
                        value: formatEther(result as bigint),
                    };
                }
            } catch (error) {
                console.error(
                    `Failed to get total shares for pool ${pool.id} at block ${block.number} (timestamp: ${block.timestamp}):`,
                    error,
                );
                return {
                    timestamp: block.timestamp,
                    value: '0',
                };
            }
        });

        // Wait for all promises in this batch to resolve
        const results = await Promise.all(promises);

        // Add results to the map
        for (const result of results) {
            totalSharesMap[result.timestamp] = result.value;
        }
    }

    return totalSharesMap;
}

async function getPoolTokenBalancesAtBlocks(
    pool: {
        id: string;
        chain: Chain;
        address: string;
        type: PrismaPoolType;
        version: number;
        protocolVersion: number;
        tokens: { address: string; token: { address: string; decimals: number } }[];
    },
    blocks: { number: number; timestamp: number }[],
): Promise<Record<number, { address: string; balance: string; index: number }[]>> {
    const client = getViemClient(pool.chain);
    const BATCH_SIZE = 100;

    // build decimals map
    const decimalsMap: Record<string, number> = {};
    for (const token of pool.tokens) {
        decimalsMap[token.address.toLowerCase()] = token.token.decimals;
    }

    const balancesMap: Record<number, { address: string; balance: string; index: number }[]> = {};

    if (pool.protocolVersion === 2) {
        // Process blocks in batches
        for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
            const batch = blocks.slice(i, i + BATCH_SIZE);

            // Create a promise for each block in the batch
            const promises = batch.map(async (block) => {
                try {
                    const result = await client.readContract({
                        address: config[pool.chain].balancer.v2.vaultAddress as `0x${string}`,
                        abi: parseAbi([
                            'function getPoolTokens(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)',
                        ]),
                        functionName: 'getPoolTokens',
                        args: [pool.id as `0x${string}`],
                        blockNumber: BigInt(block.number),
                    });

                    const tokens = (result as any)[0].map((address: string, index: number) => ({
                        address,
                        balance: formatUnits((result as any)[1][index], decimalsMap[address.toLowerCase()]),
                        index,
                    }));

                    return {
                        timestamp: block.timestamp,
                        tokens,
                    };
                } catch (error) {
                    console.error(
                        `Failed to get pool token balances for pool ${pool.id} at block ${block.number} (timestamp: ${block.timestamp}):`,
                    );
                    return {
                        timestamp: block.timestamp,
                        tokens: [],
                    };
                }
            });

            // Wait for all promises in this batch to resolve
            const results = await Promise.all(promises);

            // Add results to the map
            for (const result of results) {
                balancesMap[result.timestamp] = result.tokens;
            }
        }

        return balancesMap;
    } else if (pool.protocolVersion === 3) {
        // Process blocks in batches
        for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
            const batch = blocks.slice(i, i + BATCH_SIZE);

            // Create a promise for each block in the batch
            const promises = batch.map(async (block) => {
                try {
                    const result = await client.readContract({
                        address: config[pool.chain].balancer.v3.vaultAddress as `0x${string}`,
                        abi: parseAbi([
                            'function getPoolTokenInfo(address pool) external view returns (address[] memory tokens, uint256[] memory tokenInfo, uint256[] memory balancesRaw, uint256[] memory lastBalancesLiveScaled18)',
                        ]),
                        functionName: 'getPoolTokenInfo',
                        blockNumber: BigInt(block.number),
                        args: [pool.address as `0x${string}`],
                    });

                    const tokens = (result as any)[0].map((address: string, index: number) => ({
                        address,
                        balance: formatUnits((result as any)[2][index], decimalsMap[address.toLowerCase()]),
                        index,
                    }));

                    return {
                        timestamp: block.timestamp,
                        tokens,
                    };
                } catch (error) {
                    console.error(
                        `Failed to get pool token balances for pool ${pool.id} at block ${block.number} (timestamp: ${block.timestamp}):`,
                        error,
                    );
                    return {
                        timestamp: block.timestamp,
                        tokens: [],
                    };
                }
            });

            // Wait for all promises in this batch to resolve
            const results = await Promise.all(promises);

            // Add results to the map
            for (const result of results) {
                balancesMap[result.timestamp] = result.tokens;
            }
        }

        return balancesMap;
    } else if (pool.protocolVersion === 1) {
        // Process blocks in batches
        for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
            const batch = blocks.slice(i, i + BATCH_SIZE);

            // For protocol v1, we need to query each token balance separately for each block
            const promises = batch.map(async (block) => {
                try {
                    // For each block, query all token balances in parallel
                    const tokenPromises = pool.tokens.map(async (token, index) => {
                        try {
                            const result = await client.readContract({
                                address: pool.address as `0x${string}`,
                                abi: parseAbi(['function getBalance(address) view returns (uint256)']),
                                functionName: 'getBalance',
                                blockNumber: BigInt(block.number),
                                args: [token.address as `0x${string}`],
                            });

                            return {
                                address: token.address,
                                balance: formatUnits(result as bigint, decimalsMap[token.address.toLowerCase()]),
                                index: index,
                            };
                        } catch (error) {
                            console.error(
                                `Failed to get balance for token ${token.address} in pool ${pool.id} at block ${block.number}:`,
                                error,
                            );
                            return {
                                address: token.address,
                                balance: '0',
                                index: index,
                            };
                        }
                    });

                    const tokens = await Promise.all(tokenPromises);

                    return {
                        timestamp: block.timestamp,
                        tokens,
                    };
                } catch (error) {
                    console.error(
                        `Failed to get pool token balances for pool ${pool.id} at block ${block.number} (timestamp: ${block.timestamp}):`,
                    );
                    return {
                        timestamp: block.timestamp,
                        tokens: [],
                    };
                }
            });

            // Wait for all block promises in this batch to resolve
            const results = await Promise.all(promises);

            // Add results to the map
            for (const result of results) {
                balancesMap[result.timestamp] = result.tokens;
            }
        }

        return balancesMap;
    }

    return {};
}
