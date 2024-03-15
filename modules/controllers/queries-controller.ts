/**
 * Responsible for handling all the queries – can be split based on models
 */
import { GqlPoolJoinExitEventV3, GqlPoolSwapEventV3, QueryPoolGetEventsArgs } from '../../schema';
import { prisma } from '../../prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { JoinExitEvent, SwapEvent } from '../../prisma/prisma-types';

const parseJoinExit = (event: JoinExitEvent): GqlPoolJoinExitEventV3 => {
    return {
        __typename: 'GqlPoolJoinExitEventV3',
        tokens: event.payload.tokens.map((token) => ({
            address: token.address,
            amount: token.amount,
            valueUSD: token.valueUSD,
        })),
        ...event,
        valueUSD: event.valueUSD,
        timestamp: event.blockTimestamp,
        sender: event.userAddress,
    };
};

const parseSwap = (event: SwapEvent): GqlPoolSwapEventV3 => {
    return {
        __typename: 'GqlPoolSwapEventV3',
        ...event,
        sender: event.userAddress,
        timestamp: event.blockTimestamp,
        tokenIn: {
            ...event.payload.tokenIn,
        },
        tokenOut: {
            ...event.payload.tokenOut,
        },
    };
};

export function QueriesController(tracer?: any) {
    return {
        /**
         * Getting pool events, with pagination and filtering
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
        }: QueryPoolGetEventsArgs): Promise<(GqlPoolSwapEventV3 | GqlPoolJoinExitEventV3)[]> => {
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

            const results = dbEvents.map((event) =>
                event.type === 'SWAP' ? parseSwap(event as SwapEvent) : parseJoinExit(event as JoinExitEvent),
            );

            return results;
        },
    };
}
