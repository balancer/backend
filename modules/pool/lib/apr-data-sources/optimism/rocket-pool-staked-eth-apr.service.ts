import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';
import { collectsYieldFee, isComposableStablePool, isWeightedPoolV2 } from '../../pool-utils';

export class RocketPoolStakedEthAprService implements PoolAprService {
    private readonly RETH_ADDRESS = '0x9bcef72be871e61ed4fbbc7630889bee758eb81d';
    private readonly RETH_APR = 0.0425;

    constructor(private readonly tokenService: TokenService, private readonly yieldProtocolFeePercentage: number) {}

    public getAprServiceName(): string {
        return 'RocketPoolStakedEthAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const rethPrice = this.tokenService.getPriceForToken(tokenPrices, this.RETH_ADDRESS);
        let operations: any[] = [];
        for (const pool of pools) {
            const rethToken = pool.tokens.find((token) => token.address === this.RETH_ADDRESS);
            const rethTokenBalance = rethToken?.dynamicData?.balance;
            if (rethTokenBalance && pool.dynamicData) {
                const rethPercentage = (parseFloat(rethTokenBalance) * rethPrice) / pool.dynamicData.totalLiquidity;
                const rethApr = pool.dynamicData.totalLiquidity > 0 ? this.RETH_APR * rethPercentage : 0;
                const userApr = rethApr * (1 - this.yieldProtocolFeePercentage);

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id: `${pool.id}-reth-apr` },
                        update: { apr: collectsYieldFee(pool) ? userApr : rethApr },
                        create: {
                            id: `${pool.id}-reth-apr`,
                            poolId: pool.id,
                            apr: collectsYieldFee(pool) ? userApr : rethApr,
                            title: 'rETH APR',
                            type: 'IB_YIELD',
                        },
                    }),
                );
            }
        }
        await Promise.all(operations);
    }
}
