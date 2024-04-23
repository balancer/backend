import { GqlPoolEventsDataRange, GqlPoolJoinExitEventV3, GqlPoolSwapEventV3, QueryPoolEventsArgs } from '../../schema';
import { prisma } from '../../prisma/prisma-client';
import { PoolEventType, Prisma } from '@prisma/client';
import { JoinExitEvent, SwapEvent } from '../../prisma/prisma-types';
import { daysAgo } from '../common/time';

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

const rangeToTimestamp = (range: GqlPoolEventsDataRange): number => {
    switch (range) {
        case 'SEVEN_DAYS':
            return daysAgo(7);
        case 'THIRTY_DAYS':
            return daysAgo(30);
        case 'NINETY_DAYS':
            return daysAgo(90);
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
            first,
            skip,
            where,
        }: QueryPoolEventsArgs): Promise<(GqlPoolSwapEventV3 | GqlPoolJoinExitEventV3)[]> => {
            // Setting default values
            first = first ?? 1000;
            skip = skip ?? 0;
            let { chain, poolId, userAddress, typeIn, range } = where;

            const conditions: Prisma.PrismaPoolEventWhereInput = {
                chain,
                poolId,
            };

            if (typeIn && typeIn.length) {
                conditions.type = {
                    in: typeIn.filter((type): type is PoolEventType =>
                        Object.keys(PoolEventType).includes(type as string),
                    ),
                };
            }
            if (userAddress) {
                conditions.userAddress = {
                    equals: userAddress,
                    mode: 'insensitive',
                };
            }
            if (range) {
                conditions.blockTimestamp = {
                    gte: rangeToTimestamp(range),
                };
            }

            const dbEvents = await prisma.prismaPoolEvent.findMany({
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
