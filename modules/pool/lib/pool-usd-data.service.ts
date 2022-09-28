import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { TokenService } from '../../token/token.service';
import { BlocksSubgraphService } from '../../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';

export class PoolUsdDataService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly blockSubgraphService: BlocksSubgraphService,
        private readonly balancerSubgraphService: BalancerSubgraphService,
    ) {}

    /**
     * Liquidity is dependent on token prices, so the values here are constantly in flux.
     * When updating, the easiest is to update all pools at once.
     */
    public async updateLiquidityValuesForPools(
        minShares: number = 0.00000000001,
        maxShares: number = Number.MAX_SAFE_INTEGER,
    ) {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const pools = await prisma.prismaPool.findMany({
            include: { dynamicData: true, tokens: { include: { dynamicData: true } } },
            where: {
                dynamicData: {
                    AND: [
                        {
                            totalSharesNum: { lte: maxShares },
                        },
                        {
                            totalSharesNum: { gt: minShares },
                        },
                    ],
                },
            },
        });

        let updates: any[] = [];

        for (const pool of pools) {
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
                await Promise.all(updates);
                updates = [];
            }
        }

        await Promise.all(updates);
    }

    public async updateLiquidity24hAgoForAllPools() {
        const block24hAgo = await this.blockSubgraphService.getBlockFrom24HoursAgo();
        const tokenPrices24hAgo = await this.tokenService.getTokenPriceFrom24hAgo();

        const subgraphPools = await this.balancerSubgraphService.getAllPools(
            { block: { number: parseInt(block24hAgo.number) } },
            false,
        );

        let updates: any[] = [];
        const allPools = await prisma.prismaPool.findMany({ select: { id: true } });
        const allPoolIds = allPools.map((pool) => pool.id);

        for (const pool of subgraphPools) {
            if (!allPoolIds.includes(pool.id)) {
                console.log(`Update pool liquidity 24h ago: Missing pool with id ${pool.id}. skippipng`);
                continue;
            }
            const balanceUSDs = (pool.tokens || []).map((token) => ({
                id: token.id,
                balanceUSD:
                    token.address === pool.address
                        ? 0
                        : parseFloat(token.balance || '0') *
                          this.tokenService.getPriceForToken(tokenPrices24hAgo, token.address),
            }));
            const totalLiquidity = Math.max(
                _.sumBy(balanceUSDs, (item) => item.balanceUSD),
                0,
            );

            updates.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id: pool.id },
                    data: { totalLiquidity24hAgo: totalLiquidity, totalShares24hAgo: pool.totalShares },
                }),
            );
        }

        await prismaBulkExecuteOperations(updates);
    }

    /**
     *
     * @param poolIds the ids to update, if not provided, will update for all pools
     */
    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]) {
        const yesterday = moment().subtract(1, 'day').unix();
        const twoDaysAgo = moment().subtract(2, 'day').unix();
        const pools = await prisma.prismaPool.findMany({
            where: poolIds ? { id: { in: poolIds } } : undefined,
            include: {
                swaps: { where: { timestamp: { gte: twoDaysAgo } } },
                dynamicData: true,
            },
        });
        const operations: any[] = [];

        for (const pool of pools) {
            const volume24h = _.sumBy(
                pool.swaps.filter((swap) => swap.timestamp >= yesterday),
                (swap) => (swap.tokenIn === pool.address || swap.tokenOut === pool.address ? 0 : swap.valueUSD),
            );
            const fees24h = parseFloat(pool.dynamicData?.swapFee || '0') * volume24h;

            const volume48h = _.sumBy(pool.swaps, (swap) =>
                swap.tokenIn === pool.address || swap.tokenOut === pool.address ? 0 : swap.valueUSD,
            );
            const fees48h = parseFloat(pool.dynamicData?.swapFee || '0') * volume48h;

            if (
                pool.dynamicData &&
                (pool.dynamicData.volume24h !== volume24h ||
                    pool.dynamicData.fees24h !== fees24h ||
                    pool.dynamicData.volume48h !== volume48h ||
                    pool.dynamicData.fees48h !== fees48h)
            ) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id: pool.id },
                        data: { volume24h, fees24h, volume48h, fees48h },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }

    public async updateLifetimeValuesForAllPools() {
        let updates: any[] = [];
        const subgraphPools = await this.balancerSubgraphService.getAllPools({});
        const stakedUsers = await prisma.prismaUserStakedBalance.groupBy({
            by: ['poolId'],
            _count: { userAddress: true },
        });

        const allPools = await prisma.prismaPool.findMany({ select: { id: true } });
        const allPoolIds = allPools.map((pool) => pool.id);

        for (const pool of subgraphPools) {
            if (!allPoolIds.includes(pool.id)) {
                console.log(`Update lifetime values for pool: Missing pool with id ${pool.id}. skippipng`);
                continue;
            }
            const staked = stakedUsers.find((stakedUser) => stakedUser.poolId === pool.id);

            updates.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id: pool.id },
                    data: {
                        lifetimeVolume: parseFloat(pool.totalSwapVolume),
                        lifetimeSwapFees: parseFloat(pool.totalSwapFee),
                        holdersCount: parseInt(pool.holdersCount) + (staked?._count.userAddress || 0),
                        swapsCount: parseInt(pool.swapsCount),
                    },
                }),
            );

            const snapshots = await prisma.prismaPoolSnapshot.findMany({ where: { poolId: pool.id } });

            if (snapshots.length > 0) {
                const sharePriceAth = _.orderBy(snapshots, 'sharePrice', 'desc')[0];
                const sharePriceAtl = _.orderBy(snapshots, 'sharePrice', 'asc')[0];
                const totalLiquidityAth = _.orderBy(snapshots, 'totalLiquidity', 'desc')[0];
                const totalLiquidityAtl = _.orderBy(snapshots, 'totalLiquidity', 'asc')[0];
                const volume24hAth = _.orderBy(snapshots, 'volume24h', 'desc')[0];
                const volume24hAtl = _.orderBy(snapshots, 'volume24h', 'asc')[0];
                const fees24hAth = _.orderBy(snapshots, 'fees24h', 'desc')[0];
                const fees24hAtl = _.orderBy(snapshots, 'fees24h', 'asc')[0];

                updates.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id: pool.id },
                        data: {
                            sharePriceAth: sharePriceAth.sharePrice,
                            sharePriceAthTimestamp: sharePriceAth.timestamp,
                            sharePriceAtl: sharePriceAtl.sharePrice,
                            sharePriceAtlTimestamp: sharePriceAtl.timestamp,

                            totalLiquidityAth: totalLiquidityAth.totalLiquidity,
                            totalLiquidityAthTimestamp: totalLiquidityAth.timestamp,
                            totalLiquidityAtl: totalLiquidityAtl.totalLiquidity,
                            totalLiquidityAtlTimestamp: totalLiquidityAtl.timestamp,

                            volume24hAth: volume24hAth.volume24h,
                            volume24hAthTimestamp: volume24hAth.timestamp,
                            volume24hAtl: volume24hAtl.volume24h,
                            volume24hAtlTimestamp: volume24hAtl.timestamp,

                            fees24hAth: fees24hAth.fees24h,
                            fees24hAthTimestamp: fees24hAth.timestamp,
                            fees24hAtl: fees24hAtl.fees24h,
                            fees24hAtlTimestamp: fees24hAtl.timestamp,
                        },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(updates);
    }
}
