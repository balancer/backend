import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';
import { collectsYieldFee } from '../../pool-utils';
import { networkContext } from '../../../../network/network-context.service';
import { liquidStakedBaseAprService } from '../liquid-staked-base-apr.service';

export class RocketPoolStakedEthAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService, private readonly rethAddress: string) {}

    public getAprServiceName(): string {
        return 'RocketPoolStakedEthAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const rethPrice = this.tokenService.getPriceForToken(tokenPrices, this.rethAddress);
        const rethBaseApr = await liquidStakedBaseAprService.getREthBaseApr();

        let operations: any[] = [];
        for (const pool of pools) {
            const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                ? parseFloat(pool.dynamicData.protocolYieldFee)
                : networkContext.data.balancer.yieldProtocolFeePercentage;
            const rethToken = pool.tokens.find((token) => token.address === this.rethAddress);
            const rethTokenBalance = rethToken?.dynamicData?.balance;
            if (rethTokenBalance && pool.dynamicData) {
                const rethPercentage = (parseFloat(rethTokenBalance) * rethPrice) / pool.dynamicData.totalLiquidity;
                const rethApr = pool.dynamicData.totalLiquidity > 0 ? rethBaseApr * rethPercentage : 0;
                const userApr =
                    pool.type === 'META_STABLE'
                        ? rethApr * (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                        : rethApr * (1 - protocolYieldFeePercentage);

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: `${pool.id}-reth-apr`, chain: networkContext.chain } },
                        update: { apr: collectsYieldFee(pool) ? userApr : rethApr },
                        create: {
                            id: `${pool.id}-reth-apr`,
                            chain: networkContext.chain,
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
