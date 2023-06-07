import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { networkContext } from '../../../../network/network-context.service';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';
import { collectsYieldFee } from '../../pool-utils';
import { liquidStakedBaseAprService } from '../liquid-staked-base-apr.service';

export class AnkrStakedFtmAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService, private readonly ankrFtmAddress: string) {}

    public getAprServiceName(): string {
        return 'AnkrStakedFtmAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const ankrFtmPrice = this.tokenService.getPriceForToken(tokenPrices, this.ankrFtmAddress);

        const ankrFtmBaseApr = await liquidStakedBaseAprService.getAnkrFtmBaseApr();

        let operations: any[] = [];
        for (const pool of pools) {
            const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                ? parseFloat(pool.dynamicData.protocolYieldFee)
                : networkContext.data.balancer.yieldProtocolFeePercentage;
            const ankrFtmToken = pool.tokens.find((token) => token.address === this.ankrFtmAddress);
            const ankrFtmTokenBalance = ankrFtmToken?.dynamicData?.balance;

            if (ankrFtmTokenBalance && pool.dynamicData) {
                const ankrFtmPercentage =
                    (parseFloat(ankrFtmTokenBalance) * ankrFtmPrice) / pool.dynamicData.totalLiquidity;
                const poolAnkrFtmApr = pool.dynamicData.totalLiquidity > 0 ? ankrFtmBaseApr * ankrFtmPercentage : 0;

                const userApr =
                    pool.type === 'META_STABLE'
                        ? poolAnkrFtmApr * (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                        : poolAnkrFtmApr * (1 - protocolYieldFeePercentage);

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: `${pool.id}-ankrftm-apr`, chain: networkContext.chain } },
                        update: { apr: collectsYieldFee(pool) ? userApr : poolAnkrFtmApr },
                        create: {
                            id: `${pool.id}-ankrftm-apr`,
                            chain: networkContext.chain,
                            poolId: pool.id,
                            apr: collectsYieldFee(pool) ? userApr : poolAnkrFtmApr,
                            title: 'ankrFTM APR',
                            type: 'IB_YIELD',
                        },
                    }),
                );
            }
        }
        await Promise.all(operations);
    }
}
