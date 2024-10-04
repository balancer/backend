import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { isSupportedInt, prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { TokenService } from '../../token/token.service';
import { BlocksSubgraphService } from '../../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { networkContext } from '../../network/network-context.service';
import { capturesYield } from './pool-utils';
import * as Sentry from '@sentry/node';

export class PoolUsdDataService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly blockSubgraphService: BlocksSubgraphService,
    ) {}

    private get balancerSubgraphService() {
        return networkContext.services.balancerSubgraphService;
    }

    private get chain() {
        return networkContext.chain;
    }

    /**
     * Liquidity is dependent on token prices, so the values here are constantly in flux.
     * When updating, the easiest is to update all pools at once.
     */
    public async updateLiquidityValuesForPools(
        minShares: number = 0.00000000001,
        maxShares: number = Number.MAX_SAFE_INTEGER,
    ) {
        const tokenPrices = await this.tokenService.getTokenPrices(this.chain);
        const pdts = await prisma.prismaPoolDynamicData.findMany({
            include: { pool: { include: { tokens: { include: { dynamicData: true } } } } },
            where: {
                AND: [
                    {
                        totalSharesNum: { lte: maxShares },
                    },
                    {
                        totalSharesNum: { gt: minShares },
                    },
                ],
                chain: this.chain,
            },
        });

        let updates: any[] = [];

        for (const pdt of pdts) {
            const pool = pdt.pool;
            const balanceUSDs = pool.tokens.map((token) => ({
                id: token.id,
                balanceUSD:
                    token.address === pool.address
                        ? 0
                        : parseFloat(token.dynamicData?.balance || '0') *
                          this.tokenService.getPriceForToken(tokenPrices, token.address, this.chain),
            }));
            const totalLiquidity = _.sumBy(balanceUSDs, (item) => item.balanceUSD);

            for (const item of balanceUSDs) {
                if (!isSupportedInt(item.balanceUSD)) {
                    Sentry.captureException(
                        `Skipping unsupported int size for prismaPoolTokenDynamicData.balanceUSD: ${item.balanceUSD}`,
                        {
                            tags: {
                                tokenId: item.id,
                                poolId: pool.id,
                                poolName: pool.name,
                                chain: pool.chain,
                            },
                        },
                    );
                    continue;
                }
                updates.push(
                    prisma.prismaPoolTokenDynamicData.update({
                        where: { id_chain: { id: item.id, chain: pool.chain } },
                        data: { balanceUSD: item.balanceUSD },
                    }),
                );
            }
            if (!isSupportedInt(totalLiquidity)) {
                Sentry.captureException(
                    `Skipping unsupported int size for prismaPoolDynamicData.totalLiquidity: ${totalLiquidity} `,
                    {
                        tags: {
                            poolId: pool.id,
                            poolName: pool.name,
                            chain: pool.chain,
                        },
                    },
                );
                continue;
            }

            updates.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
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

    /**
     *
     * @param poolIds the ids to update, if not provided, will update for all pools
     */
    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]) {
        const yesterday = moment().subtract(1, 'day').unix();
        const twoDaysAgo = moment().subtract(2, 'day').unix();
        const pools = await prisma.prismaPool.findMany({
            where: poolIds ? { id: { in: poolIds }, chain: this.chain } : { chain: this.chain, protocolVersion: 2 },
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
                        where: { id_chain: { id: pool.id, chain: pool.chain } },
                        data: { volume24h, fees24h, volume48h, fees48h },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }

    /*
        We approximate the yield fee capture of the last 24h by taking the current total yield APR and apply it to the average totalLiquidity from now and 24 hours ago.
        We approximate the yield fee capture of the last 48h by taking the current total yield APR and apply it to the totalLiquidity from 24 hours ago.
    */
    public async updateYieldCaptureForAllPools() {
        const pools = await prisma.prismaPool.findMany({
            where: { chain: this.chain },
            include: {
                dynamicData: true,
                aprItems: true,
            },
        });
        const operations: any[] = [];

        for (const pool of pools) {
            if (pool.dynamicData?.totalLiquidity && capturesYield(pool)) {
                const totalLiquidity = pool.dynamicData.totalLiquidity;
                const totalLiquidity24hAgo = pool.dynamicData.totalLiquidity24hAgo;
                let userYieldApr = 0;

                // we approximate total APR by summing it up, as APRs are usually small, this is good enough
                // we need IB yield APR (such as sFTMx) as well as phantom stable APR, which is set for phantom stable pools
                // we need any phantom stable pool or weighted pool that has either a phantom stable nested, which has no apr type set (done by boosted-pool-apr.service.ts)
                pool.aprItems.forEach((aprItem) => {
                    if (aprItem.type === 'IB_YIELD' || aprItem.type === null) {
                        userYieldApr += aprItem.apr;
                    }
                });

                const liquidityAverage24h = (totalLiquidity + totalLiquidity24hAgo) / 2;
                const yieldForUser48h = ((totalLiquidity24hAgo * userYieldApr) / 365) * 2;
                const yieldForUser24h = (liquidityAverage24h * userYieldApr) / 365;

                const protocolYieldFeePercentage = parseFloat(pool.dynamicData.protocolYieldFee || '0');
                const protocolSwapFeePercentage = parseFloat(pool.dynamicData.protocolSwapFee || '0');

                let yieldCapture24h =
                    pool.type === 'META_STABLE'
                        ? yieldForUser24h / (1 - protocolSwapFeePercentage)
                        : yieldForUser24h / (1 - protocolYieldFeePercentage);

                let yieldCapture48h =
                    pool.type === 'META_STABLE'
                        ? yieldForUser48h / (1 - protocolSwapFeePercentage)
                        : yieldForUser48h / (1 - protocolYieldFeePercentage);

                // if the pool is in recovery mode, the protocol does not take any fee and therefore the user takes all yield captured
                // since this is already reflected in the aprItems of the pool, we need to set that as the totalYieldCapture
                if (pool.dynamicData.isInRecoveryMode || pool.type === 'LIQUIDITY_BOOTSTRAPPING') {
                    yieldCapture24h = yieldForUser24h;
                    yieldCapture48h = yieldForUser48h;
                }

                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: pool.chain } },
                        data: { yieldCapture24h, yieldCapture48h },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }

    /**
     * This function depends on pools data to be up to date, so it should be called after
     * poolService.syncAllPoolsFromSubgraph or mutation poolSyncAllPoolsFromSubgraph
     */
    public async updateLifetimeValuesForAllPools() {
        let updates: any[] = [];
        const subgraphPools = await this.balancerSubgraphService.getAllPools({});
        const stakedUsers = await prisma.prismaUserStakedBalance.groupBy({
            by: ['poolId'],
            _count: { userAddress: true },
            where: { chain: this.chain, balanceNum: { gt: 0 } },
        });

        const subgraphPoolIds = subgraphPools.map((pool) => pool.id);

        const dbPools = await prisma.prismaPool.findMany({
            where: { id: { in: subgraphPoolIds }, chain: this.chain },
            include: {
                dynamicData: true,
                snapshots: true,
            },
        });

        for (const pool of subgraphPools) {
            const staked = stakedUsers.find((stakedUser) => stakedUser.poolId === pool.id);
            const dbPool = dbPools.find((poolInDb) => poolInDb.id === pool.id);
            if (!dbPool) continue;

            // Limit numbers, as we have seen some pools with skewd values
            const max = 1e18;
            const lifetimeVolume = Math.min(parseFloat(pool.totalSwapVolume), max);
            const lifetimeSwapFees = Math.min(parseFloat(pool.totalSwapFee), max);
            const holdersCount = parseInt(pool.holdersCount) + (staked?._count.userAddress || 0);

            if (
                !dbPool.dynamicData ||
                dbPool.dynamicData.lifetimeVolume !== lifetimeVolume ||
                dbPool.dynamicData.lifetimeSwapFees !== lifetimeSwapFees ||
                dbPool.dynamicData.holdersCount !== holdersCount ||
                dbPool.dynamicData.swapsCount !== parseInt(pool.swapsCount)
            ) {
                updates.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: this.chain } },
                        data: {
                            lifetimeVolume: lifetimeVolume,
                            lifetimeSwapFees: lifetimeSwapFees,
                            holdersCount: holdersCount,
                            swapsCount: parseInt(pool.swapsCount),
                        },
                    }),
                );
            }

            if (dbPool.snapshots.length > 0) {
                const sharePriceAth = _.orderBy(dbPool.snapshots, 'sharePrice', 'desc')[0];
                const sharePriceAtl = _.orderBy(dbPool.snapshots, 'sharePrice', 'asc')[0];
                const totalLiquidityAth = _.orderBy(dbPool.snapshots, 'totalLiquidity', 'desc')[0];
                const totalLiquidityAtl = _.orderBy(dbPool.snapshots, 'totalLiquidity', 'asc')[0];
                const volume24hAth = _.orderBy(dbPool.snapshots, 'volume24h', 'desc')[0];
                const volume24hAtl = _.orderBy(dbPool.snapshots, 'volume24h', 'asc')[0];
                const fees24hAth = _.orderBy(dbPool.snapshots, 'fees24h', 'desc')[0];
                const fees24hAtl = _.orderBy(dbPool.snapshots, 'fees24h', 'asc')[0];

                if (
                    !dbPool.dynamicData ||
                    dbPool.dynamicData.sharePriceAth !== sharePriceAth.sharePrice ||
                    dbPool.dynamicData.sharePriceAthTimestamp !== sharePriceAth.timestamp ||
                    dbPool.dynamicData.sharePriceAtl !== sharePriceAtl.sharePrice ||
                    dbPool.dynamicData.sharePriceAtlTimestamp !== sharePriceAtl.timestamp ||
                    dbPool.dynamicData.totalLiquidityAth !== totalLiquidityAth.totalLiquidity ||
                    dbPool.dynamicData.totalLiquidityAthTimestamp !== totalLiquidityAth.timestamp ||
                    dbPool.dynamicData.totalLiquidityAtl !== totalLiquidityAtl.totalLiquidity ||
                    dbPool.dynamicData.totalLiquidityAtlTimestamp !== totalLiquidityAtl.timestamp ||
                    dbPool.dynamicData.volume24hAth !== volume24hAth.volume24h ||
                    dbPool.dynamicData.volume24hAthTimestamp !== volume24hAth.timestamp ||
                    dbPool.dynamicData.volume24hAtl !== volume24hAtl.volume24h ||
                    dbPool.dynamicData.volume24hAtlTimestamp !== volume24hAtl.timestamp ||
                    dbPool.dynamicData.fees24hAth !== fees24hAth.fees24h ||
                    dbPool.dynamicData.fees24hAthTimestamp !== fees24hAth.timestamp ||
                    dbPool.dynamicData.fees24hAtl !== fees24hAtl.fees24h ||
                    dbPool.dynamicData.fees24hAtlTimestamp !== fees24hAtl.timestamp
                ) {
                    updates.push(
                        prisma.prismaPoolDynamicData.update({
                            where: { id_chain: { id: pool.id, chain: this.chain } },
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
        }

        await prismaBulkExecuteOperations(updates);
    }
}
