import { tokenPriceService } from '../../token-price/token-price.service';
import { prisma } from '../../util/prisma-client';
import _ from 'lodash';

export class PoolUsdDataService {
    public async updateLiquidityValuesForAllPools() {
        const tokenPrices = await tokenPriceService.getTokenPrices();
        const pools = await prisma.prismaPool.findMany({
            include: { dynamicData: true, tokens: { include: { dynamicData: true } } },
            where: { dynamicData: { totalShares: { gt: '0.00000000001' } } },
        });

        let updates: any[] = [];

        for (const pool of pools) {
            const balanceUSDs = pool.tokens.map((token) => ({
                id: token.id,
                balanceUSD:
                    parseFloat(token.dynamicData?.balance || '0') *
                    tokenPriceService.getPriceForToken(tokenPrices, token.address),
            }));
            const totalLiquidity = _.sumBy(balanceUSDs, (item) => item.balanceUSD);

            for (const item of balanceUSDs) {
                updates.push(
                    prisma.prismaPoolTokenDynamicData.update({
                        where: { id: item.id },
                        data: { balanceUSD: `${item.balanceUSD}` },
                    }),
                );
            }

            updates.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id: pool.id },
                    data: { totalLiquidity: `${totalLiquidity}` },
                }),
            );

            if (updates.length > 100) {
                await prisma.$transaction(updates);
                updates = [];
            }
        }

        await prisma.$transaction(updates);
    }
}
