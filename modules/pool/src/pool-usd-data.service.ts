import { prisma } from '../../util/prisma-client';
import _ from 'lodash';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import moment from 'moment-timezone';
import { OrderDirection, Swap_OrderBy } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { TokenService } from '../../token/token.service';

export class PoolUsdDataService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly balancerSubgraphService: BalancerSubgraphService,
    ) {}

    /**
     * Liquidity is dependent on token prices, so the values here are constantly in flux.
     * When updating, the easiest is to update all pools at once.
     */
    public async updateLiquidityValuesForAllPools() {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const pools = await prisma.prismaPool.findMany({
            include: { dynamicData: true, tokens: { include: { dynamicData: true } } },
            //where: { dynamicData: { totalShares: { gt: '0.00000000001' } } },
        });

        const filtered = pools.filter((pool) => parseFloat(pool.dynamicData?.totalShares || '0') > 0.00000000001);

        let updates: any[] = [];

        for (const pool of filtered) {
            const balanceUSDs = pool.tokens.map((token) => ({
                id: token.id,
                balanceUSD:
                    token.address === pool.address
                        ? 0
                        : parseFloat(token.dynamicData?.balance || '0') *
                          this.tokenService.getPriceForToken(tokenPrices, token.address),
            }));
            const totalLiquidity = _.sumBy(balanceUSDs, (item) => item.balanceUSD);

            for (const item of balanceUSDs) {
                updates.push(
                    prisma.prismaPoolTokenDynamicData.update({
                        where: { id: item.id },
                        data: { balanceUSD: item.balanceUSD },
                    }),
                );
            }

            updates.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id: pool.id },
                    data: { totalLiquidity },
                }),
            );

            if (updates.length > 100) {
                await prisma.$transaction(updates);
                updates = [];
            }
        }

        await prisma.$transaction(updates);
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

    /**
     *
     * @param poolIds the ids to update, if not provided, will update for all pools
     */
    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]) {
        const yesterday = moment().subtract(1, 'day').unix();
        const pools = await prisma.prismaPool.findMany({
            where: poolIds ? { id: { in: poolIds } } : undefined,
            include: {
                swaps: { where: { timestamp: { gte: yesterday } } },
                dynamicData: true,
            },
        });
        const operations: any[] = [];

        for (const pool of pools) {
            const volume24h = _.sumBy(pool.swaps, (swap) => swap.valueUSD);
            const fees24h = parseFloat(pool.dynamicData?.swapFee || '0') * volume24h;

            if (
                pool.dynamicData &&
                (pool.dynamicData.volume24h !== volume24h || pool.dynamicData.fees24h !== fees24h)
            ) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id: pool.id },
                        data: { volume24h, fees24h },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }
}
