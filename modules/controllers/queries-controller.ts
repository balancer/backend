/**
 * Responsible for handling all the queries – can be split based on models
 */
import { GqlPoolEvent, QueryPoolGetEventsArgs } from '../../schema';
import { prisma } from '../../prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { JoinExitEvent, SwapEvent } from '../../prisma/prisma-types';

const parseJoinExit = (event: JoinExitEvent): GqlPoolEvent => {
    return {
        __typename: 'GqlPoolJoinExit',
        amounts: event.payload.tokens.map((token: any) => ({
            address: token.address,
            amount: token.amount,
            valueUSD: token.amountUsd,
        })),
        ...event,
        timestamp: event.blockTimestamp,
        sender: event.userAddress,
    };
};

const parseSwap = (event: SwapEvent): GqlPoolEvent => {
    return {
        __typename: 'GqlPoolSwap',
        ...event,
        timestamp: event.blockTimestamp,
        tokenIn: event.payload.tokenIn.address,
        tokenAmountIn: event.payload.tokenIn.amount,
        tokenInData: {
            ...event.payload.tokenIn,
        },
        tokenOut: event.payload.tokenOut.address,
        tokenAmountOut: event.payload.tokenOut.amount,
        tokenOutData: {
            ...event.payload.tokenOut,
        },
    };
};

export function QueriesController(tracer?: any) {
    return {
        getEvents: async ({ first, skip, where }: QueryPoolGetEventsArgs): Promise<GqlPoolEvent[]> => {
            // Setting default values
            first = first ?? 1000;
            skip = skip ?? 0;
            where = where ?? {};
            let { chainIn, poolIdIn, userAddress, typeIn } = where;

            const conditions: Prisma.PoolEventWhereInput = {};

            if (typeIn && typeIn.length) {
                conditions.type = {
                    in: typeIn,
                };
            }
            if (chainIn && chainIn.length) {
                conditions.chain = {
                    in: chainIn,
                };
            }
            if (poolIdIn && poolIdIn.length) {
                conditions.poolId = {
                    in: poolIdIn,
                    mode: 'insensitive',
                };
            }
            if (userAddress) {
                conditions.userAddress = {
                    equals: userAddress,
                    mode: 'insensitive',
                };
            }

            const dbEvents = await prisma.poolEvent.findMany({
                where: conditions,
                take: first,
                skip,
                orderBy: [
                    {
                        blockNumber: 'desc',
                    },
                    {
                        logIndex: 'desc',
                    },
                ],
            });

            const results: GqlPoolEvent[] = dbEvents.map((event) =>
                event.type === 'SWAP' ? parseSwap(event as SwapEvent) : parseJoinExit(event as JoinExitEvent),
            );

            return results;
        },
    };
}
