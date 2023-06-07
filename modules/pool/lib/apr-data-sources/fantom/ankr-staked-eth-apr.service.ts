import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';
import { collectsYieldFee } from '../../pool-utils';
import { liquidStakedBaseAprService } from '../liquid-staked-base-apr.service';
import { networkContext } from '../../../../network/network-context.service';

export class AnkrStakedEthAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService, private readonly ankrEthAddress: string) {}

    public getAprServiceName(): string {
        return 'AnkrStakedEthAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const ankrEthPrice = this.tokenService.getPriceForToken(tokenPrices, this.ankrEthAddress);

        const ankrEthBaseApr = await liquidStakedBaseAprService.getAnkrEthBaseApr();

        let operations: any[] = [];
        for (const pool of pools) {
            const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                ? parseFloat(pool.dynamicData.protocolYieldFee)
                : networkContext.data.balancer.yieldProtocolFeePercentage;
            const ankrEthToken = pool.tokens.find((token) => token.address === this.ankrEthAddress);
            const ankrEthTokenBalance = ankrEthToken?.dynamicData?.balance;
            if (ankrEthTokenBalance && pool.dynamicData) {
                const ankrEthPercentage =
                    (parseFloat(ankrEthTokenBalance) * ankrEthPrice) / pool.dynamicData.totalLiquidity;
                const poolAnkrEthApr = pool.dynamicData.totalLiquidity > 0 ? ankrEthBaseApr * ankrEthPercentage : 0;
                const userApr =
                    pool.type === 'META_STABLE'
                        ? poolAnkrEthApr * (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                        : poolAnkrEthApr * (1 - protocolYieldFeePercentage);
                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: `${pool.id}-ankreth-apr`, chain: networkContext.chain } },
                        update: { apr: collectsYieldFee(pool) ? userApr : poolAnkrEthApr },
                        create: {
                            id: `${pool.id}-ankreth-apr`,
                            chain: networkContext.chain,
                            poolId: pool.id,
                            apr: collectsYieldFee(pool) ? userApr : poolAnkrEthApr,
                            title: 'ankrETH APR',
                            type: 'IB_YIELD',
                        },
                    }),
                );
            }
        }
        await Promise.all(operations);
    }
}
