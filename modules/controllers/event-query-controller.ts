import {
    GqlPoolAddRemoveEventV3,
    GqlPoolSwapEventV3,
    QueryPoolEventsArgs,
    GqlPoolSwapEventCowAmm,
    GqlPoolEventType,
} from '../../apps/api/gql/generated-schema';
import { Chain, PoolEventType } from '@prisma/client';
import { JoinExitEvent, SwapEvent } from '../../prisma/prisma-types';
import { eventsRepository } from '../repositories/events';

const parseJoinExit = (event: JoinExitEvent): GqlPoolAddRemoveEventV3 => {
    return {
        __typename: 'GqlPoolAddRemoveEventV3',
        tokens: event.payload.tokens.map((token) => ({
            address: token.address,
            amount: token.amount,
            valueUSD: token.valueUSD,
        })),
        ...event,
        type: event.type === 'JOIN' ? 'ADD' : 'REMOVE',
        valueUSD: event.valueUSD,
        timestamp: event.blockTimestamp,
        sender: event.userAddress,
    };
};

const parseSwap = (event: SwapEvent): GqlPoolSwapEventV3 => {
    return {
        __typename: 'GqlPoolSwapEventV3',
        ...event,
        valueUSD: event.valueUSD || 0,
        sender: event.userAddress,
        timestamp: event.blockTimestamp,
        tokenIn: {
            ...event.payload.tokenIn,
            valueUSD: event.valueUSD,
        },
        tokenOut: {
            ...event.payload.tokenOut,
            valueUSD: event.valueUSD,
        },
        fee: {
            ...event.payload.fee,
            valueUSD: Number(event.payload.fee.valueUSD),
        },
    };
};

const parseCowAmmSwap = (event: SwapEvent): GqlPoolSwapEventCowAmm => {
    const regularSwap = parseSwap(event);
    return {
        ...regularSwap,
        __typename: 'GqlPoolSwapEventCowAmm',
        surplus: (event.payload.surplus && {
            ...event.payload.surplus,
            valueUSD: Number(event.payload.surplus.valueUSD),
        }) || { address: '', amount: '0', valueUSD: 0 },
    };
};

const GqlTypeToDbType: Record<GqlPoolEventType, PoolEventType> = {
    SWAP: 'SWAP',
    ADD: 'JOIN',
    REMOVE: 'EXIT',
};

const getMultichainEvents = async (chainIn: Chain[], limit: number = 100) => {
    const results = await Promise.all(
        chainIn.map(async (chain) => {
            return (await eventsRepository.getEvents({ chain, limit: Math.min(100, limit) })).map((event) =>
                event.type === 'SWAP' && (event as SwapEvent).payload?.surplus
                    ? parseCowAmmSwap(event as SwapEvent)
                    : event.type === 'SWAP'
                      ? parseSwap(event as SwapEvent)
                      : parseJoinExit(event as JoinExitEvent),
            );
        }),
    );

    return results.flat().sort((a, b) => {
        if (a.blockTimestamp === b.blockTimestamp) {
            if (a.blockNumber === b.blockNumber) {
                return a.logIndex - b.logIndex;
            }
            return a.blockNumber - b.blockNumber;
        }
        return a.blockTimestamp - b.blockTimestamp;
    });
};

export function EventsQueryController(env = process.env) {
    return {
        /**
         * Getting pool events, with pagination and filtering. This is for all vault versions.
         *
         * @param param.first - number of items to return
         * @param param.skip - number of items to skip
         * @param param.where - filtering conditions
         * @returns
         */
        getEvents: async ({
            first,
            skip,
            where,
        }: QueryPoolEventsArgs): Promise<(GqlPoolSwapEventV3 | GqlPoolSwapEventCowAmm | GqlPoolAddRemoveEventV3)[]> => {
            // Setting default values
            first = Math.min(1000, first ?? 1000); // Limiting to 1000 items
            skip = skip ?? 0;
            let { chainIn, poolIdIn, typeIn, userAddress } = where || {};

            if (!chainIn) {
                return [];
            }

            // Table is partitioned by chain, so querying by many chains is extermenly inefficient.
            if (chainIn && chainIn.length > 1) {
                return getMultichainEvents(chainIn as Chain[], first);
            }

            const conditions = {
                chain: chainIn[0] as Chain,
                ...(typeIn && typeIn.length > 0 ? { eventType: GqlTypeToDbType[typeIn[0] as GqlPoolEventType] } : {}),
                ...(poolIdIn && poolIdIn.length > 0 ? { poolId: poolIdIn[0] as string } : {}),
                userAddress: userAddress || undefined,
            };

            const dbEvents = await eventsRepository.getEvents({
                ...conditions,
                limit: first,
                offset: skip,
            });

            const results = dbEvents.map((event) =>
                event.type === 'SWAP' && (event as SwapEvent).payload?.surplus
                    ? parseCowAmmSwap(event as SwapEvent)
                    : event.type === 'SWAP'
                      ? parseSwap(event as SwapEvent)
                      : parseJoinExit(event as JoinExitEvent),
            );

            return results;
        },
    };
}
