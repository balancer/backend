import { prisma } from '../../util/prisma-client';
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
    public async updateLiquidityValuesForAllPools() {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const pools = await prisma.prismaPool.findMany({
            include: { dynamicData: true, tokens: { include: { dynamicData: true } } },
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

    public async updateLiquidity24hAgoForAllPools() {
        const block24hAgo = await this.blockSubgraphService.getBlockFrom24HoursAgo();
        const tokenPrices24hAgo = await this.tokenService.getTokenPriceFrom24hAgo();

        const subgraphPools = await this.balancerSubgraphService.getAllPools(
            { block: { number: parseInt(block24hAgo.number) } },
            false,
        );

        let updates: any[] = [];

        for (const pool of subgraphPools) {
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
                    data: { totalLiquidity24hAgo: totalLiquidity },
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
}
