import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';
import { isComposableStablePool, isWeightedPoolV2 } from '../../pool-utils';

export class WstethAprService implements PoolAprService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly wstethAprEndpoint: string,
        private readonly wstethContractAddress: string,
        private readonly yieldProtocolFeePercentage: number,
    ) {}
    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const wstethPrice = this.tokenService.getPriceForToken(tokenPrices, this.wstethContractAddress);

        let wstethBaseApr: number | undefined;
        for (const pool of pools) {
            const itemId = `${pool.id}-lido-wsteth`;

            const wstethToken = pool.tokens.find((token) => token.address === this.wstethContractAddress.toLowerCase());
            const wstethTokenBalance = wstethToken?.dynamicData?.balance;
            if (wstethTokenBalance && pool.dynamicData) {
                if (!wstethBaseApr) {
                    const { data } = await axios.get<string>(this.wstethAprEndpoint);
                    wstethBaseApr = parseFloat(data) / 100;
                }
                const wstethPercentage =
                    (parseFloat(wstethTokenBalance) * wstethPrice) / pool.dynamicData.totalLiquidity;
                const wstethApr = pool.dynamicData.totalLiquidity > 0 ? wstethBaseApr * wstethPercentage : 0;
                const grossApr = wstethBaseApr * (1 - this.yieldProtocolFeePercentage);
                const collectsYieldFee =
                    isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE';

                await prisma.prismaPoolAprItem.upsert({
                    where: { id: itemId },
                    create: {
                        id: itemId,
                        poolId: pool.id,
                        title: `LIDO APR`,
                        apr: collectsYieldFee ? grossApr : wstethApr,
                        type: 'IB_YIELD',
                    },
                    update: { apr: collectsYieldFee ? grossApr : wstethApr },
                });
            }
        }
    }
}
