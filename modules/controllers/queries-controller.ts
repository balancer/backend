/**
 * Responsible for handling all the queries – can be split based on models
 */
import { GqlPoolJoinExit, QueryPoolGetJoinExitsArgs } from '../../schema';
import { prisma } from '../../prisma/prisma-client';
import { Chain } from '@prisma/client';

export function QueriesController(tracer?: any) {
    return {
        // TODO: I'd like to merge it with the swaps and return all as pool events
        getJoinExits: async ({ first, skip, where }: QueryPoolGetJoinExitsArgs): Promise<GqlPoolJoinExit[]> => {
            // Setting default values
            first = first ?? 5;
            skip = skip ?? 0;
            where = where ?? {};
            let { chainIn, poolIdIn } = where;
            chainIn = chainIn ?? []; // 🤔 when no chain, shouldn't we be returning all the chains?
            poolIdIn = poolIdIn ?? [];

            const conditions: { poolId?: { in: string[] }; chain?: { in: Chain[] } } = {};
            if (chainIn.length) {
                conditions.chain = {
                    in: chainIn,
                };
            }
            if (poolIdIn.length) {
                conditions.poolId = {
                    in: poolIdIn,
                };
            }

            const dbJoinExists = await prisma.poolEvent.findMany({
                where: conditions,
                take: first,
                skip,
                orderBy: [
                    {
                        blockNumber: 'desc',
                    },
                    {
                        logPosition: 'desc',
                    },
                ],
            });

            const results: GqlPoolJoinExit[] = dbJoinExists.map((joinExit) => {
                const payload = joinExit.payload as {
                    tokens: { address: string; amount: string; amountUsd: string }[];
                };

                return {
                    __typename: 'GqlPoolJoinExit',
                    amounts: payload.tokens.map((token: any) => ({
                        address: token.address,
                        amount: token.amount,
                        valueUsd: token.amountUsd,
                    })),
                    chain: joinExit.chain,
                    id: joinExit.id,
                    poolId: joinExit.poolId,
                    sender: joinExit.userAddress,
                    timestamp: joinExit.blockTimestamp,
                    tx: joinExit.tx,
                    type: joinExit.type === 'JOIN' ? 'Join' : 'Exit',
                    valueUSD: String(joinExit.amountUsd),
                };
            });

            return results;
        },
    };
}
