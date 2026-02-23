import _ from 'lodash';
import { Chain, PoolEventType } from '@prisma/client';
import { JoinExitEvent } from '../../../prisma/prisma-types';
import { CowAmmAddRemoveFragment } from '../subgraphs/cow-amm/generated/types';

/**
 * Takes COW subgraph join/exit events and transforms them into DB entries
 *
 * @param events
 * @param chain
 * @param protocolVersion
 * @returns
 */
export async function joinExitCowTransformer(
    events: CowAmmAddRemoveFragment[],
    chain: Chain,
    protocolVersion = 3,
): Promise<JoinExitEvent[]> {
    return events.map((event) => ({
        protocolVersion,
        id: event.id, // tx + logIndex
        tx: event.transactionHash,
        type: event.type === 'Add' ? PoolEventType.JOIN : PoolEventType.EXIT,
        poolId: event.pool.id,
        chain: chain,
        userAddress: event.user.id,
        blockNumber: Number(event.blockNumber),
        blockTimestamp: Number(event.blockTimestamp),
        logIndex: Number(event.logIndex),
        valueUSD: 0,
        payload: {
            tokens: event.pool.tokens.map((token) => ({
                address: token.address,
                amount: event.amounts[token.index],
                valueUSD: 0,
            })),
        },
    }));
}
