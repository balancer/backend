import {
    GqlPoolEventsDataRange,
    GqlPoolJoinExitEventV3 as GqlPoolJoinExitEvent,
    GqlPoolSwapEventV3 as GqlPoolSwapEvent,
    QueryPoolGetEventsArgs,
} from '../../schema';
import { prisma } from '../../prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { JoinExitEvent, SwapEvent } from '../../prisma/prisma-types';
import moment from 'moment';

const parseJoinExit = (event: JoinExitEvent): GqlPoolJoinExitEvent => {
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

const parseSwap = (event: SwapEvent): GqlPoolSwapEvent => {
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
    };
};

const getTimestampForRange = (range: GqlPoolEventsDataRange): number => {
    switch (range) {
        case 'SEVEN_DAYS':
            return moment().startOf('day').subtract(7, 'days').unix();
        case 'THIRTY_DAYS':
            return moment().startOf('day').subtract(30, 'days').unix();
        case 'NINETY_DAYS':
            return moment().startOf('day').subtract(90, 'days').unix();
    }
};

export function EventsQueryController(tracer?: any) {
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
            range,
            poolId,
            chain,
            typeIn,
            userAddress,
        }: QueryPoolGetEventsArgs): Promise<(GqlPoolSwapEvent | GqlPoolJoinExitEvent)[]> => {
            // Setting default values

            const conditions: Prisma.PrismaPoolEventWhereInput = {};

            if (userAddress) {
                conditions.userAddress = {
                    equals: userAddress,
                    mode: 'insensitive',
                };
            }

            const since = getTimestampForRange(range);
            conditions.blockTimestamp = {
                gte: since,
            };

            const dbEvents = await prisma.prismaPoolEvent.findMany({
                where: {
                    ...conditions,
                    poolId: poolId,
                    chain: chain,
                    type: {
                        in: typeIn,
                    },
                    blockTimestamp: {
                        gte: since,
                    },
                },
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
