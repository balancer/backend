import { prisma } from '../../../prisma/prisma-client';
import moment from 'moment-timezone';
import {
    JoinExit_OrderBy,
    OrderDirection,
    Swap_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { tokenService, TokenService } from '../../token/token.service';
import {
    GqlPoolJoinExit,
    GqlPoolSwap,
    QueryPoolGetBatchSwapsArgs,
    QueryPoolGetJoinExitsArgs,
    QueryPoolGetSwapsArgs,
} from '../../../schema';
import { Chain, PrismaPoolSwap } from '@prisma/client';
import _ from 'lodash';
import { isSupportedInt, prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { PrismaPoolBatchSwapWithSwaps, prismaPoolMinimal } from '../../../prisma/prisma-types';
import { networkContext } from '../../network/network-context.service';
import * as Sentry from '@sentry/node';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';

export class PoolSwapService {
    constructor(
        private readonly tokenService: TokenService,
    ) {}

    private get balancerSubgraphService() {
        return networkContext.services.balancerSubgraphService;
    }

    private get chain() {
        return networkContext.chain;
    }

    public async getJoinExits(args: QueryPoolGetJoinExitsArgs): Promise<GqlPoolJoinExit[]> {
        const first = !args.first || args.first > 100 ? 10 : args.first;

        const allChainsJoinExits: GqlPoolJoinExit[] = [];

        for (const chain of args.where!.chainIn!) {
            const balancerSubgraphService =
                AllNetworkConfigsKeyedOnChain[chain].services.balancerSubgraphService;

            const { joinExits } = await balancerSubgraphService.getPoolJoinExits({
                where: { pool_in: args.where?.poolIdIn },
                first,
                skip: args.skip,
                orderBy: JoinExit_OrderBy.Timestamp,
                orderDirection: OrderDirection.Desc,
            });

            const mappedJoinExits: GqlPoolJoinExit[] = joinExits.map((joinExit) => ({
                ...joinExit,
                __typename: 'GqlPoolJoinExit',
                chain: chain,
                poolId: joinExit.pool.id,
                amounts: joinExit.amounts.map((amount, index) => ({
                    address: joinExit.pool.tokensList[index],
                    amount,
                })),
            }));

            allChainsJoinExits.push(...mappedJoinExits);
        }

        return allChainsJoinExits;
    }

    public async getUserJoinExitsForPool(
        userAddress: string,
        poolId: string,
        chain: Chain,
        first = 10,
        skip = 0,
    ): Promise<GqlPoolJoinExit[]> {
        const balancerSubgraphService =
            AllNetworkConfigsKeyedOnChain[chain].services.balancerSubgraphService;

        const { joinExits } = await balancerSubgraphService.getPoolJoinExits({
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
            chain: chain,
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
                chain: {
                    in: args.where?.chainIn || undefined,
                },
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    public async getUserSwapsForPool(
        userAddress: string,
        poolId: string,
        chain: Chain,
        first = 10,
        skip = 0,
    ): Promise<GqlPoolSwap[]> {
        const balancerSubgraphService =
            AllNetworkConfigsKeyedOnChain[chain].services.balancerSubgraphService;

        const result = await balancerSubgraphService.getSwaps({
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
            chain: chain,
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
                chain: {
                    in: args.where?.chainIn || undefined,
                },
            },
            orderBy: { timestamp: 'desc' },
            include: {
                swaps: { include: { pool: { include: prismaPoolMinimal.include } } },
            },
        });
    }

    /**
     * Syncs all swaps for the last 48 hours. We fetch the timestamp of the last stored swap to avoid
     * duplicate effort. Return an array of poolIds with swaps added.
     */
    public async syncSwapsForLast48Hours(): Promise<string[]> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const lastSwap = await prisma.prismaPoolSwap.findFirst({
            orderBy: { timestamp: 'desc' },
            where: { chain: this.chain },
        });
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
                    let valueUSD = 0;
                    const tokenInPrice = this.tokenService.getPriceForToken(tokenPrices, swap.tokenIn);
                    const tokenOutPrice = this.tokenService.getPriceForToken(tokenPrices, swap.tokenOut);

                    if (tokenInPrice > 0) {
                        valueUSD = tokenInPrice * parseFloat(swap.tokenAmountIn);
                    } else {
                        valueUSD = tokenOutPrice * parseFloat(swap.tokenAmountOut);
                    }

                    if (valueUSD === 0) {
                        valueUSD = parseFloat(swap.valueUSD);
                    }

                    poolIds.add(swap.poolId.id);
                    txs.add(swap.tx);
                    if (!isSupportedInt(valueUSD)) {
                        Sentry.captureException(
                            `Sett unsupported int size for prismaPoolSwap.valueUSD: ${valueUSD} to 0`,
                            {
                                tags: {
                                    tokenIn: swap.tokenIn,
                                    tokenInAmount: swap.tokenAmountIn,
                                    tokenInPrice: tokenInPrice,
                                    tokenOut: swap.tokenOut,
                                    tokenOutAmount: swap.tokenAmountOut,
                                    tokenOutPrice: tokenOutPrice,
                                },
                            },
                        );
                        valueUSD = 0;
                    }

                    return {
                        id: swap.id,
                        chain: this.chain,
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

        await prisma.prismaPoolSwap.deleteMany({
            where: {
                timestamp: { lt: twoDaysAgo },
                chain: this.chain,
            },
        });
        await prisma.prismaPoolBatchSwap.deleteMany({
            where: {
                timestamp: { lt: twoDaysAgo },
                chain: this.chain,
            },
        });

        return Array.from(poolIds);
    }

    private async createBatchSwaps(txs: string[]) {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const swaps = await prisma.prismaPoolSwap.findMany({ where: { tx: { in: txs }, chain: this.chain } });
        const groupedByTxAndUser = _.groupBy(swaps, (swap) => `${swap.tx}${swap.userAddress}`);
        let operations: any[] = [
            prisma.prismaPoolSwap.updateMany({
                where: { tx: { in: txs }, chain: this.chain },
                data: { batchSwapId: null, batchSwapIdx: null },
            }),
            prisma.prismaPoolBatchSwap.deleteMany({ where: { tx: { in: txs }, chain: this.chain } }),
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
                                chain: this.chain,
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
                                where: { id_chain: { id: swap.id, chain: this.chain } },
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
