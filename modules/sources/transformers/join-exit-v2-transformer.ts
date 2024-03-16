import _ from 'lodash';
import { BalancerJoinExitFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { Chain, PoolEventType } from '@prisma/client';
import { JoinExitEvent } from '../../../prisma/prisma-types';

/**
 * Takes V3 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export function joinExitV2Transformer(events: BalancerJoinExitFragment[], chain: Chain): JoinExitEvent[] {
    const vaultVersion = 2;

    return events.map((event) => ({
        vaultVersion,
        id: event.id, // tx + logIndex
        tx: event.tx,
        type: event.type === 'Join' ? PoolEventType.JOIN : PoolEventType.EXIT,
        poolId: event.pool.id,
        chain: chain,
        userAddress: event.sender,
        blockNumber: Number(event.block),
        blockTimestamp: Number(event.timestamp),
        logIndex: Number(event.id.substring(66)),
        valueUSD: 0,
        payload: {
            tokens: event.pool.tokensList.map((token, i) => ({
                address: token,
                amount: event.amounts[i],
                valueUSD: 0,
            })),
        },
    }));
}
