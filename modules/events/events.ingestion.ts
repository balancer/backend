import { LatestEventRepository, EventStoreRepository } from '../repositories/events';
import { prisma } from '../../prisma/prisma-client';
import { jsonRpcStream } from './actions/json-rpc-stream';
import { eventStreamConfig } from './actions/stream-config';
import { swapParser, liquidityParser } from './actions/parsers';
import { swapsUsd, joinExitsUsd } from '../sources/enrichers';
import type { ViemClient } from '../sources/viem-client';
import { chainIdToChain } from '../network/chain-id-to-chain';

// Unified Balancer ingestion workflow with new pipeline
export async function eventsIngestion(
    viemClient: ViemClient,
    events: LatestEventRepository & EventStoreRepository,
    v3Vault?: string,
    options?: { fromBlock?: bigint; batchSize?: number },
) {
    const chainId = viemClient.chain.id;
    const chain = chainIdToChain[chainId];

    let totalSwaps = 0;
    let totalLiquidity = 0;
    let totalPools = 0;
    let totalBatches = 0;

    const fromBlock: bigint =
        options?.fromBlock ?? (await events.getLatestEvent({ chain }).then((event) => BigInt(event!.blockNumber)));

    console.log(`[events-ingestion] Starting from block ${fromBlock} (chain=${chain})`);

    // Seed feeCache with latest fees from database when resuming
    const feeCache = await prisma.prismaPoolDynamicData
        .findMany({
            select: { id: true, swapFee: true },
            where: {
                chain,
            },
        })
        .then((results) => new Map<string, number>(results.map((item) => [item.id, Number(item.swapFee)])));

    const decimalsMap = await prisma.prismaToken
        .findMany({
            select: { address: true, decimals: true },
            where: {
                chain,
            },
        })
        .then((results) => new Map<string, number>(results.map((item) => [item.address, Number(item.decimals)])));

    const v3PoolTokensMap = await prisma.prismaPoolToken
        .findMany({
            select: { poolId: true, index: true, address: true },
            where: {
                chain,
                pool: {
                    protocolVersion: 3,
                },
            },
        })
        .then((results) =>
            results.reduce(
                (obj, item) => {
                    if (!obj[item.poolId]) {
                        obj[item.poolId] = [];
                    }

                    obj[item.poolId][item.index] = item.address;

                    return obj;
                },
                {} as Record<string, string[]>,
            ),
        )
        .then((records) => new Map(Object.entries(records)));

    const streamConfig = eventStreamConfig(chain);

    for await (const rawLogs of jsonRpcStream(viemClient, fromBlock, streamConfig, options?.batchSize)) {
        if (rawLogs.length === 0) continue;

        totalBatches++;

        // Parse: decode raw logs into domain events and collect dependencies
        const swapEvents = swapParser(chain, rawLogs, feeCache, decimalsMap, v3Vault); // updates feeCache
        const liquidityEvents = liquidityParser(chain, rawLogs, decimalsMap, v3PoolTokensMap, v3Vault);

        // Add USD pricing
        const swapEventsUsd = await swapsUsd(swapEvents, chain);
        const liquidityEventsUsd = await joinExitsUsd(liquidityEvents, chain);

        // Store swaps and liquidity events
        await events.storeEvents([...swapEventsUsd, ...liquidityEventsUsd]);

        totalSwaps += swapEvents.length;
        totalLiquidity += liquidityEvents.length;

        // Emit events for downstream consumers
        // if (swapResult.saved > 0) {
        //     eventBus.emit('swapsReceived', {});
        // }
        // if (liquidityResult.saved > 0) {
        //     eventBus.emit('liquidityEventsReceived', {});
        // }

        console.log(
            `[events-ingestion] Batch ${totalBatches}: +${swapEvents.length} swaps, +${liquidityEvents.length} liquidity events (total: ${totalSwaps} swaps, ${totalLiquidity} liquidity)`,
        );
    }

    console.log(
        `[events-ingestion] Complete: ${totalSwaps} swaps, ${totalLiquidity} liquidity events in ${totalBatches} batches`,
    );

    return {
        pools: totalPools,
        swaps: totalSwaps,
        liquidityEvents: totalLiquidity,
        batches: totalBatches,
    };
}
