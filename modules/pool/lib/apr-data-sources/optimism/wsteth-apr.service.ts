import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';
import { collectsYieldFee } from '../../pool-utils';
import { networkContext } from '../../../../network/network-context.service';
import { liquidStakedBaseAprService } from '../liquid-staked-base-apr.service';

export class WstethAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService, private readonly wstethContractAddress: string) {}

    public getAprServiceName(): string {
        return 'WstethAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const wstethPrice = this.tokenService.getPriceForToken(tokenPrices, this.wstethContractAddress);

        let wstethBaseApr: number | undefined;
        for (const pool of pools) {
            const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                ? parseFloat(pool.dynamicData.protocolYieldFee)
                : networkContext.data.balancer.yieldProtocolFeePercentage;
            const itemId = `${pool.id}-lido-wsteth`;

            const wstethToken = pool.tokens.find((token) => token.address === this.wstethContractAddress.toLowerCase());
            const wstethTokenBalance = wstethToken?.dynamicData?.balance;

            if (wstethTokenBalance && pool.dynamicData) {
                if (!wstethBaseApr) {
                    wstethBaseApr = await liquidStakedBaseAprService.getWstEthBaseApr();
                }

                const wstethPercentage =
                    (parseFloat(wstethTokenBalance) * wstethPrice) / pool.dynamicData.totalLiquidity;
                const wstethApr = pool.dynamicData.totalLiquidity > 0 ? wstethBaseApr * wstethPercentage : 0;
                const userApr =
                    pool.type === 'META_STABLE'
                        ? wstethApr * (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                        : wstethApr * (1 - protocolYieldFeePercentage);

                await prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: itemId, chain: networkContext.chain } },
                    create: {
                        id: itemId,
                        chain: networkContext.chain,
                        poolId: pool.id,
                        title: `stETH APR`,
                        apr: collectsYieldFee(pool) ? userApr : wstethApr,
                        type: 'IB_YIELD',
                    },
                    update: { apr: collectsYieldFee(pool) ? userApr : wstethApr, title: `stETH APR` },
                });
            }
        }
    }
}
