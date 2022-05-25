import { prisma } from '../../util/prisma-client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { TokenService } from '../../token/token.service';

export class PoolUsdDataService {
    constructor(private readonly tokenService: TokenService) {}

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
            const volume24h = _.sumBy(pool.swaps, (swap) =>
                swap.tokenIn === pool.address || swap.tokenOut === pool.address ? 0 : swap.valueUSD,
            );
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
