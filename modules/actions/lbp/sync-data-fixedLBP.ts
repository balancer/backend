import { Chain, PrismaPoolType } from '@prisma/client';
import { fixedLbpCalls, LBPCallsOutput } from '../../sources/contracts/pool-type-dynamic-data';
import { prisma } from '../../../prisma/prisma-client';
import { multicallViem } from '../../web3/multicaller-viem';
import { ViemClient } from '../../sources/types';
import { eventsRepository } from '../../repositories/events/events-repository';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

/**
 * Fetches new weights and updates pool tokens
 */
export const syncDataFixedLBP = async (
    chain: Chain,
    client: ViemClient,
    eventRepo = eventsRepository,
): Promise<void> => {
    const [pools, dynamicDataMap] = await Promise.all([
        prisma.prismaPool.findMany({
            where: {
                chain,
                type: PrismaPoolType.FIXED_LBP,
                protocolVersion: 3,
            },
            select: { id: true, version: true, typeData: true },
        }),
        prisma.prismaPoolDynamicData
            .findMany({
                where: {
                    chain,
                    pool: {
                        chain,
                        type: PrismaPoolType.FIXED_LBP,
                        protocolVersion: 3,
                    },
                },
                select: { id: true, swapEnabled: true },
            })
            .then((records) => Object.fromEntries(records.map((dd) => [dd.id, dd]))),
    ]);

    const callsFixedLBP = pools.flatMap(({ id }) => fixedLbpCalls(id));

    const onchainData = (await multicallViem(client, callsFixedLBP)) as Record<string, LBPCallsOutput>;

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

    await prismaBulkExecuteOperations([...swapEnabledUpdates, ...holdersUpdates]);

    return;
};
