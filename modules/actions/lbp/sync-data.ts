import { Chain, PrismaPoolType } from '@prisma/client';
import { fixedLbpCalls, lbpCalls, LBPCallsOutput } from '../../sources/contracts/pool-type-dynamic-data';
import { prisma } from '../../../prisma/prisma-client';
import { multicallViem } from '../../web3/multicaller-viem';
import { ViemClient } from '../../sources/types';
import { eventsRepository } from '../../repositories/events/events-repository';
import { lbpCallsV3 } from '../../sources/contracts/pool-type-dynamic-data/lbp-calls-v3';

/**
 * Fetches new weights and updates pool tokens
 */
export const syncData = async (
    chain: Chain,
    client: ViemClient,
    vaultAddress: string,
    eventRepo = eventsRepository,
): Promise<void> => {
    const [pools, tokens, dynamicDataMap] = await Promise.all([
        prisma.prismaPool.findMany({
            where: {
                chain,
                type: { in: [PrismaPoolType.LIQUIDITY_BOOTSTRAPPING, PrismaPoolType.FIXED_LBP] },
                protocolVersion: 3,
            },
            select: { id: true, type: true, version: true, typeData: true },
        }),
        prisma.prismaPoolToken
            .findMany({
                where: {
                    pool: {
                        chain,
                        type: { in: [PrismaPoolType.LIQUIDITY_BOOTSTRAPPING, PrismaPoolType.FIXED_LBP] },
                        protocolVersion: 3,
                    },
                },
                select: {
                    id: true,
                    weight: true,
                },
            })
            .then((records) =>
                records.reduce((acc, token) => {
                    acc[token.id] = token;
                    return acc;
                }, {} as Record<string, (typeof records)[0]>),
            ),
        prisma.prismaPoolDynamicData
            .findMany({
                where: {
                    chain,
                    pool: {
                        chain,
                        type: { in: [PrismaPoolType.LIQUIDITY_BOOTSTRAPPING, PrismaPoolType.FIXED_LBP] },
                        protocolVersion: 3,
                    },
                },
                select: { id: true, swapEnabled: true },
            })
            .then((records) => Object.fromEntries(records.map((dd) => [dd.id, dd]))),
    ]);

    const calls = pools
        .filter(
            (pool) =>
                pool.type === PrismaPoolType.LIQUIDITY_BOOTSTRAPPING && (pool.version === 1 || pool.version === 2),
        )
        .flatMap(({ id }) => lbpCalls(id));

    const callsV3 = pools
        .filter((pool) => pool.type === PrismaPoolType.LIQUIDITY_BOOTSTRAPPING && pool.version === 3)
        .flatMap(({ id }) => lbpCallsV3(id, vaultAddress));

    const callsFixedLBP = pools
        .filter((pool) => pool.type === PrismaPoolType.FIXED_LBP)
        .flatMap(({ id }) => fixedLbpCalls(id));

    const onchainData = (await multicallViem(client, [...calls, ...callsV3, ...callsFixedLBP])) as Record<
        string,
        LBPCallsOutput
    >;

    const updates = Object.keys(onchainData).flatMap((id) => onchainData[id].poolToken);

    const operations = updates
        // Check if the weights are different
        .filter((update) => {
            if (!update) return false;
            const token = tokens[update.id];
            if (!token) return false;
            return token.weight !== update.weight;
        })
        .flatMap((update) =>
            prisma.prismaPoolToken.update({
                where: { id_chain: { id: update.id, chain } },
                data: {
                    weight: update.weight,
                },
            }),
        );

    // Update swapEnabled as well
    const swapEnabledUpdates = Object.keys(onchainData)
        .map((id) => onchainData[id].poolDynamicData)
        .filter((update) => update.swapEnabled !== dynamicDataMap[update.id]!.swapEnabled)
        .map((update) =>
            prisma.prismaPoolDynamicData.update({
                where: { id_chain: { id: update.id, chain } },
                data: {
                    swapEnabled: update.swapEnabled,
                },
            }),
        );

    // Get top trades
    const trades = await Promise.allSettled(
        pools.map(async (pool) => {
            const trades = await eventRepo.getTopTrades(pool.id, chain, 10);
            return [
                pool.id,
                trades.map((trade) => ({
                    address: trade.userAddress,
                    value: trade.valueUSD,
                    timestamp: trade.blockTimestamp,
                })),
            ];
        }),
    )
        .then((results) => results.filter((r) => r.status === 'fulfilled'))
        .then((results) => results.filter((r) => r.value && r.value[1] && r.value[1].length > 0))
        .then((results) => results.map((r) => r.value))
        .then((results) => Object.fromEntries(results));

    const typeDataMap = Object.fromEntries(pools.map((pool) => [pool.id, pool.typeData]));

    const holdersUpdates = Object.keys(trades).map((poolId) =>
        prisma.prismaPool.update({
            where: { id_chain: { id: poolId, chain } },
            data: {
                typeData: {
                    ...(typeDataMap[poolId] as any),
                    topTrades: trades[poolId],
                },
            },
        }),
    );

    await prisma.$transaction([...operations, ...swapEnabledUpdates, ...holdersUpdates]);

    return;
};
