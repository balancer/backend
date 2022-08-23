import { prisma } from '../../../prisma/prisma-client';
import moment from 'moment-timezone';
import {
    JoinExit_OrderBy,
    OrderDirection,
    Swap_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { tokenService, TokenService } from '../../token/token.service';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import {
    GqlPoolJoinExit,
    GqlPoolSwap,
    QueryPoolGetBatchSwapsArgs,
    QueryPoolGetJoinExitsArgs,
    QueryPoolGetSwapsArgs,
    QueryPoolGetUserSwapVolumeArgs,
} from '../../../schema';
import { PrismaPoolSwap } from '@prisma/client';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { PrismaPoolBatchSwapWithSwaps, prismaPoolMinimal } from '../../../prisma/prisma-types';

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

    public async getUserJoinExitsForPool(
        userAddress: string,
        poolId: string,
        first = 10,
        skip = 0,
    ): Promise<GqlPoolJoinExit[]> {
        const { joinExits } = await this.balancerSubgraphService.getPoolJoinExits({
            where: { pool: poolId, user: userAddress },
            first,
            skip: skip,
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

    public async getUserSwapsForPool(
        userAddress: string,
        poolId: string,
        first = 10,
        skip = 0,
    ): Promise<GqlPoolSwap[]> {
        const result = await this.balancerSubgraphService.getSwaps({
            first,
            skip,
            where: {
                poolId,
                userAddress,
            },
            orderBy: Swap_OrderBy.Timestamp,
            orderDirection: OrderDirection.Desc,
        });

        return result.swaps.map((swap) => ({
            id: swap.id,
            userAddress,
            poolId: swap.poolId.id,
            tokenIn: swap.tokenIn,
            tokenAmountIn: swap.tokenAmountIn,
            tokenOut: swap.tokenOut,
            tokenAmountOut: swap.tokenAmountOut,
            valueUSD: parseFloat(swap.valueUSD),
            timestamp: swap.timestamp,
            tx: swap.tx,
        }));
    }

    public async getBatchSwaps(args: QueryPoolGetBatchSwapsArgs): Promise<PrismaPoolBatchSwapWithSwaps[]> {
        const take = !args.first || args.first > 100 ? 10 : args.first;

        return prisma.prismaPoolBatchSwap.findMany({
            take,
            skip: args.skip || undefined,
            where: {
                swaps: args.where?.poolIdIn
                    ? {
                          some: {
                              poolId: {
                                  in: args.where.poolIdIn,
                              },
                          },
                      }
                    : undefined,
                tokenIn: {
                    in: args.where?.tokenInIn || undefined,
                },
                tokenOut: {
                    in: args.where?.tokenOutIn || undefined,
                },
            },
            orderBy: { timestamp: 'desc' },
            include: {
                swaps: { include: { pool: { include: prismaPoolMinimal.include } } },
            },
        });
    }

    public async getUserSwapVolume(args: QueryPoolGetUserSwapVolumeArgs) {
        const yesterday = moment().subtract(1, 'day').unix();
        const take = !args.first || args.first > 100 ? 10 : args.first;

        const result = await prisma.prismaPoolSwap.groupBy({
            take,
            skip: args.skip || undefined,
            by: ['userAddress'],
            _sum: { valueUSD: true },
            orderBy: { _sum: { valueUSD: 'desc' } },
            where: {
                poolId: { in: args.where?.poolIdIn || undefined },
                tokenIn: { in: args.where?.tokenInIn || undefined },
                tokenOut: { in: args.where?.tokenOutIn || undefined },
                timestamp: { gte: yesterday },
            },
        });

        return result.map((item) => ({ userAddress: item.userAddress, swapVolumeUSD: `${item._sum.valueUSD || 0}` }));
    }

    /**
     * Syncs all swaps for the last 48 hours. We fetch the timestamp of the last stored swap to avoid
     * duplicate effort. Return an array of poolIds with swaps added.
     */
    public async syncSwapsForLast48Hours(): Promise<string[]> {
        const allPoolAddresses = (await prisma.prismaPool.findMany({ select: { address: true } })).map(
            (item) => item.address,
        );
        const tokenPrices = await this.tokenService.getTokenPrices();
        const lastSwap = await prisma.prismaPoolSwap.findFirst({ orderBy: { timestamp: 'desc' } });
        const twoDaysAgo = moment().subtract(2, 'day').unix();
        //ensure we only sync the last 48 hours worth of swaps
        let timestamp = lastSwap && lastSwap.timestamp > twoDaysAgo ? lastSwap.timestamp : twoDaysAgo;
        let hasMore = true;
        let skip = 0;
        const pageSize = 1000;
        const MAX_SKIP = 5000;
        const poolIds = new Set<string>();
        const txs = new Set<string>();

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

                    if (
                        valueUSD === 0 ||
                        //does the swap include a nested BPT
                        allPoolAddresses.includes(swap.tokenIn) ||
                        allPoolAddresses.includes(swap.tokenOut)
                    ) {
                        const tokenInPrice = this.tokenService.getPriceForToken(tokenPrices, swap.tokenIn);
                        const tokenOutPrice = this.tokenService.getPriceForToken(tokenPrices, swap.tokenOut);

                        if (tokenInPrice > 0) {
                            valueUSD = tokenInPrice * parseFloat(swap.tokenAmountIn);
                        } else {
                            valueUSD = tokenOutPrice * parseFloat(swap.tokenAmountOut);
                        }
                    }

                    poolIds.add(swap.poolId.id);
                    txs.add(swap.tx);

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

            await this.createBatchSwaps(Array.from(txs));
            txs.clear();

            if (swaps.length < pageSize) {
                hasMore = false;
            }

            skip += pageSize;

            if (skip > MAX_SKIP) {
                timestamp = swaps[swaps.length - 1].timestamp;
                skip = 0;
            }
        }

        await prisma.prismaPoolSwap.deleteMany({ where: { timestamp: { lt: twoDaysAgo } } });
        await prisma.prismaPoolBatchSwap.deleteMany({ where: { timestamp: { lt: twoDaysAgo } } });

        return Array.from(poolIds);
    }

    private async createBatchSwaps(txs: string[]) {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const swaps = await prisma.prismaPoolSwap.findMany({ where: { tx: { in: txs } } });
        const groupedByTxAndUser = _.groupBy(swaps, (swap) => `${swap.tx}${swap.userAddress}`);
        let operations: any[] = [
            prisma.prismaPoolSwap.updateMany({
                where: { tx: { in: txs } },
                data: { batchSwapId: null, batchSwapIdx: null },
            }),
            prisma.prismaPoolBatchSwap.deleteMany({ where: { tx: { in: txs } } }),
        ];

        for (const group of Object.values(groupedByTxAndUser)) {
            const inMap = _.keyBy(group, this.getSwapInKey);
            const outMap = _.keyBy(group, this.getSwapOutKey);
            //start swaps are the tokenIn-tokenAmountIn that doesn't have an out
            const startSwaps = group.filter((swap) => !outMap[this.getSwapInKey(swap)]);

            for (const startSwap of startSwaps) {
                const batchSwaps: PrismaPoolSwap[] = [startSwap];
                let current = startSwap;

                while (inMap[this.getSwapOutKey(current)]) {
                    current = inMap[this.getSwapOutKey(current)];
                    batchSwaps.push(current);
                }

                if (batchSwaps.length > 0) {
                    const startSwap = batchSwaps[0];
                    const endSwap = batchSwaps[batchSwaps.length - 1];

                    operations = [
                        ...operations,
                        prisma.prismaPoolBatchSwap.create({
                            data: {
                                id: startSwap.id,
                                timestamp: startSwap.timestamp,
                                userAddress: startSwap.userAddress,
                                tokenIn: startSwap.tokenIn,
                                tokenAmountIn: startSwap.tokenAmountIn,
                                tokenOut: endSwap.tokenOut,
                                tokenAmountOut: endSwap.tokenAmountOut,
                                tx: startSwap.tx,
                                valueUSD: endSwap.valueUSD,
                                tokenInPrice: tokenService.getPriceForToken(tokenPrices, startSwap.tokenIn),
                                tokenOutPrice: tokenService.getPriceForToken(tokenPrices, endSwap.tokenOut),
                            },
                        }),
                        ...batchSwaps.map((swap, index) =>
                            prisma.prismaPoolSwap.update({
                                where: { id: swap.id },
                                data: { batchSwapId: startSwap.id, batchSwapIdx: index },
                            }),
                        ),
                    ];
                }
            }
        }

        await prismaBulkExecuteOperations(operations, true);
    }

    private getSwapOutKey(swap: PrismaPoolSwap): string {
        return `${swap.tokenOut}${swap.tokenAmountOut}`;
    }

    private getSwapInKey(swap: PrismaPoolSwap): string {
        return `${swap.tokenIn}${swap.tokenAmountIn}`;
    }
}
