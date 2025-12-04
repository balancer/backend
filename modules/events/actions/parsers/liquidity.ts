import { abiMap, V2_LIQUIDITY_TOPIC, V3_ADD_LIQUIDITY_TOPIC, V3_REMOVE_LIQUIDITY_TOPIC } from '../stream-config';
import type { StreamLog } from '../json-rpc-stream';
import { Chain } from '@prisma/client';
import { Hex, decodeEventLog, formatUnits } from 'viem';
import { JoinExitEvent } from '../../../../prisma/prisma-types';

// Parse: decode raw logs into domain events and collect dependencies
export const parse = (
    chain: Chain,
    logs: StreamLog[],
    decimalsMap: Map<string, number>,
    v3PoolTokensMap: Map<string, string[]>,
    v3Vault?: string,
) => {
    const events: JoinExitEvent[] = [];

    for (const log of logs) {
        const topic0 = log.topics[0];
        if (
            topic0 !== V2_LIQUIDITY_TOPIC &&
            topic0 !== V3_ADD_LIQUIDITY_TOPIC &&
            topic0 !== V3_REMOVE_LIQUIDITY_TOPIC
        ) {
            continue;
        }

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

        const eventHead = {
            id: `${log.transactionHash}${log.logIndex}`,
            chain,
            poolId,
            protocolVersion: log.address === v3Vault ? 3 : (2 as 2 | 3),
            tx: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
            blockTimestamp: log.timestamp,
            userAddress: log.transactionFrom.toLowerCase() as Hex,
        };

        // V2: PoolBalanceChanged - one event with multiple token changes
        if (topic0 === V2_LIQUIDITY_TOPIC) {
            events.push({
                ...eventHead,
                type: Number(args.deltas[0]) < 0 ? 'EXIT' : 'JOIN',
                payload: {
                    tokens: (args.tokens as string[]).map((t, i) => {
                        const address = t.toLowerCase();
                        const decimals = decimalsMap.get(address);
                        if (!decimals) throw 'Missing decimals';

                        return {
                            address,
                            amount: formatUnits(args.deltas[i], decimals),
                            valueUSD: 0,
                        };
                    }),
                },
                valueUSD: 0,
            });
        }
        // V3: LiquidityAdded
        else if (topic0 === V3_ADD_LIQUIDITY_TOPIC) {
            events.push({
                ...eventHead,
                type: 'JOIN',
                payload: {
                    tokens: (args.amountsAddedRaw as bigint[]).map((amount, i) => {
                        const poolTokens = v3PoolTokensMap.get(poolId);
                        if (!poolTokens) throw `Missing pool chain=${chain} pool=${poolId}`;
                        const address = poolTokens[i];
                        if (!address) throw `Missing pool token chain=${chain} pool=${poolId} token=${address}`;
                        const decimals = decimalsMap.get(address);
                        if (!decimals) throw `Missing decimals chain=${chain} token=${address}`;

                        return {
                            address,
                            amount: formatUnits(amount, decimals),
                            valueUSD: 0,
                        };
                    }),
                },
                valueUSD: 0,
            });
        }
        // V3: LiquidityRemoved
        else if (topic0 === V3_REMOVE_LIQUIDITY_TOPIC) {
            events.push({
                ...eventHead,
                type: 'EXIT',
                payload: {
                    tokens: (args.amountsRemovedRaw as bigint[]).map((amount, i) => {
                        const poolTokens = v3PoolTokensMap.get(poolId);
                        if (!poolTokens) throw `Missing pool chain=${chain} pool=${poolId}`;
                        const address = poolTokens[i];
                        if (!address) throw `Missing pool token chain=${chain} pool=${poolId} token=${address}`;
                        const decimals = decimalsMap.get(address);
                        if (!decimals) throw `Missing decimals chain=${chain} token=${address}`;

                        return {
                            address,
                            amount: formatUnits(amount, decimals),
                            valueUSD: 0,
                        };
                    }),
                },
                valueUSD: 0,
            });
        }
    }

    return events;
};
