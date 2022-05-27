import { prisma } from '../../util/prisma-client';
import moment from 'moment-timezone';
import {
    JoinExit_OrderBy,
    OrderDirection,
    Swap_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { TokenService } from '../../token/token.service';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { GqlPoolJoinExit, QueryPoolGetJoinExitsArgs, QueryPoolGetSwapsArgs } from '../../../schema';
import { PrismaPoolSwap } from '@prisma/client';

export class PoolSwapService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly balancerSubgraphService: BalancerSubgraphService,
    ) {}

    public async getJoinExits(args: QueryPoolGetJoinExitsArgs): Promise<GqlPoolJoinExit[]> {
        const first = !args.first || args.first > 100 ? 10 : args.first;

        const { joinExits } = await this.balancerSubgraphService.getPoolJoinExits({
            where: { pool_in: args.where?.poolIdIn },
            first,
            skip: args.skip,
            orderBy: JoinExit_OrderBy.Timestamp,
            orderDirection: OrderDirection.Desc,
        });

        return joinExits.map((joinExit) => ({
            ...joinExit,
            __typename: 'GqlPoolJoinExit',
            poolId: joinExit.pool.id,
            amounts: joinExit.amounts.map((amount, index) => ({ address: joinExit.pool.tokensList[index], amount })),
        }));
    }

    public async getSwaps(args: QueryPoolGetSwapsArgs): Promise<PrismaPoolSwap[]> {
        const take = !args.first || args.first > 100 ? 10 : args.first;

        return prisma.prismaPoolSwap.findMany({
            take,
            skip: args.skip || undefined,
            where: {
                poolId: {
                    in: args.where?.poolIdIn || undefined,
                },
                tokenIn: {
                    in: args.where?.tokenInIn || undefined,
                },
                tokenOut: {
                    in: args.where?.tokenOutIn || undefined,
                },
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    /**
     * Syncs all swaps for the last 24 hours. We fetch the timestamp of the last stored swap to avoid
     * duplicate effort. Return an array of poolIds with swaps added.
     */
    public async syncSwapsForLast24Hours(): Promise<string[]> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const lastSwap = await prisma.prismaPoolSwap.findFirst({ orderBy: { timestamp: 'desc' } });
        const yesterday = moment().subtract(1, 'day').unix();
        //ensure we only sync the last 24 hours worth of swaps
        let timestamp = lastSwap && lastSwap.timestamp > yesterday ? lastSwap.timestamp : yesterday;
        let hasMore = true;
        let skip = 0;
        const pageSize = 1000;
        const MAX_SKIP = 5000;
        const poolIds = new Set<string>();

        while (hasMore) {
            const { swaps } = await this.balancerSubgraphService.getSwaps({
                first: pageSize,
                skip,
                where: { timestamp_gte: timestamp },
                orderBy: Swap_OrderBy.Timestamp,
                orderDirection: OrderDirection.Asc,
            });

            console.log(`loading ${swaps.length} new swaps into the db...`);

            if (swaps.length === 0) {
                break;
            }

            await prisma.prismaPoolSwap.createMany({
                skipDuplicates: true,
                data: swaps.map((swap) => {
                    let valueUSD = parseFloat(swap.valueUSD);

                    if (valueUSD === 0) {
                        const tokenInPrice = this.tokenService.getPriceForToken(tokenPrices, swap.tokenIn);
                        const tokenOutPrice = this.tokenService.getPriceForToken(tokenPrices, swap.tokenOut);

                        if (tokenInPrice > 0) {
                            valueUSD = tokenInPrice * parseFloat(swap.tokenAmountIn);
                        } else {
                            valueUSD = tokenOutPrice * parseFloat(swap.tokenAmountOut);
                        }
                    }

                    poolIds.add(swap.poolId.id);

                    return {
                        id: swap.id,
                        timestamp: swap.timestamp,
                        poolId: swap.poolId.id,
                        userAddress: swap.userAddress.id,
                        tokenIn: swap.tokenIn,
                        tokenInSym: swap.tokenInSym,
                        tokenOut: swap.tokenOut,
                        tokenOutSym: swap.tokenOutSym,
                        tokenAmountIn: swap.tokenAmountIn,
                        tokenAmountOut: swap.tokenAmountOut,
                        tx: swap.tx,
                        valueUSD,
                    };
                }),
            });

            if (swaps.length < pageSize) {
                hasMore = false;
            }

            skip += pageSize;

            if (skip > MAX_SKIP) {
                timestamp = swaps[swaps.length - 1].timestamp;
                skip = 0;
            }
        }

        await prisma.prismaPoolSwap.deleteMany({ where: { timestamp: { lt: yesterday } } });

        return Array.from(poolIds);
    }
}
