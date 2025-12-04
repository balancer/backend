import { abiMap, V2_SWAP_TOPIC, V3_SWAP_TOPIC, V2_SWAP_FEE_PERCENTAGE_CHANGED_TOPIC } from '../stream-config';
import type { StreamLog } from '../json-rpc-stream';
import { SwapEvent } from '../../../../prisma/prisma-types';
import { Hex, decodeEventLog, formatEther, formatUnits } from 'viem';
import { Chain } from '@prisma/client';

// Parse: decode raw logs into swap events, applying fees from cache
export const parse = (
    chain: Chain,
    logs: StreamLog[],
    feeCache: Map<string, number>,
    decimalsMap: Map<string, number>,
    v3Vault?: string,
) => {
    const swapEvents: SwapEvent[] = [];

    // Process logs in order, updating fee cache as we encounter fee changes
    for (const log of logs) {
        const topic0 = log.topics[0];

        // Update fee cache when we see fee change events
        if (topic0 === V2_SWAP_FEE_PERCENTAGE_CHANGED_TOPIC) {
            const abi = abiMap[topic0 as keyof typeof abiMap];
            if (!abi) continue;

            const decoded = decodeEventLog({
                abi: [abi],
                eventName: abi.name,
                data: log.data as Hex,
                topics: log.topics as [signature: Hex],
            });

            if (!decoded.args) continue;
            const args = decoded.args as any;

            feeCache.set(log.address.substring(0, 42).toLowerCase(), Number(formatEther(args.swapFeePercentage)));
            continue;
        }

        // Parse swap events and apply current fee from cache
        if (topic0 !== V2_SWAP_TOPIC && topic0 !== V3_SWAP_TOPIC) continue;

        const abi = abiMap[topic0 as keyof typeof abiMap];
        if (!abi) continue;

        const decoded = decodeEventLog({
            abi: [abi],
            eventName: abi.name,
            data: log.data as Hex,
            topics: log.topics as [signature: Hex],
        });

        if (!decoded.args) continue;

        const args = decoded.args as any;
        const poolId = (args.poolId || args.pool || log.address).toLowerCase();
        const decimalsIn = decimalsMap.get(args.tokenIn.toLowerCase());
        const decimalsOut = decimalsMap.get(args.tokenOut.toLowerCase());

        if (!decimalsIn || !decimalsOut) throw 'Missing decimals';

        // Use fee from event if present, otherwise use cached fee
        const feePercentage = args.swapFeePercentage
            ? Number(formatEther(args.swapFeePercentage))
            : feeCache.get(poolId) || 0;

        // Dynamic fee needs pool.swapFee, so dynamic fee = swap fee - pool fee
        const dynamicFeePercentage = args.swapFeePercentage ? feePercentage - (feeCache.get(poolId) || 0) : 0;
        const dynamicFee = BigInt(Math.floor(Number(args.amountIn) * dynamicFeePercentage));

        // Calculate fee amount: use from event if present, otherwise calculate from amountIn
        const fee =
            args.swapFeeAmount && args.swapFeeAmount !== 0n
                ? args.swapFeeAmount
                : BigInt(Math.floor(Number(args.amountIn) * feePercentage));

        swapEvents.push({
            id: `${log.transactionHash}${log.logIndex}`,
            chain,
            type: 'SWAP' as const,
            poolId,
            protocolVersion: log.address === v3Vault ? 3 : (2 as 2 | 3),
            tx: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
            blockTimestamp: log.timestamp,
            userAddress: log.transactionFrom.toLowerCase(),
            payload: {
                fee: {
                    address: args.tokenIn.toLowerCase(),
                    amount: formatUnits(fee, decimalsIn),
                    valueUSD: '',
                },
                ...(dynamicFee > 0n
                    ? {
                          dynamicFee: {
                              address: args.tokenIn.toLowerCase(),
                              amount: formatUnits(dynamicFee, decimalsIn),
                              valueUSD: '',
                          },
                      }
                    : {}),
                tokenIn: {
                    address: args.tokenIn.toLowerCase(),
                    amount: formatUnits(args.amountIn, decimalsIn),
                },
                tokenOut: {
                    address: args.tokenOut.toLowerCase(),
                    amount: formatUnits(args.amountOut, decimalsOut),
                },
                // surplus: {}
            },
            valueUSD: 0,
        });
    }

    return swapEvents;
};
