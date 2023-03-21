import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { networkContext } from '../../../../network/network-context.service';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';

export class AnkrStakedFtmAprService implements PoolAprService {
    private readonly ankrFTM_ADDRESS = '0xcfc785741dc0e98ad4c9f6394bb9d43cd1ef5179';

    constructor(private readonly tokenService: TokenService) {}

    public getAprServiceName(): string {
        return 'AnkrStakedFtmAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const ankrFtmPrice = this.tokenService.getPriceForToken(tokenPrices, this.ankrFTM_ADDRESS);

        const { data } = await axios.get<{ services: { serviceName: string; apy: string }[] }>(
            'https://api.staking.ankr.com/v1alpha/metrics',
            {},
        );

        const ankrFtmApy = data.services.find((service) => service.serviceName === 'ftm');
        const totalAnkrFTMApr = parseFloat(ankrFtmApy?.apy || '0') / 100;

        let operations: any[] = [];
        for (const pool of pools) {
            const ankrFtmToken = pool.tokens.find((token) => token.address === this.ankrFTM_ADDRESS);
            const ankrFtmTokenBalance = ankrFtmToken?.dynamicData?.balance;
            if (ankrFtmTokenBalance && pool.dynamicData) {
                const ankrFtmPercentage =
                    (parseFloat(ankrFtmTokenBalance) * ankrFtmPrice) / pool.dynamicData.totalLiquidity;
                const poolAnkrFtmApr = pool.dynamicData.totalLiquidity > 0 ? totalAnkrFTMApr * ankrFtmPercentage : 0;
                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: `${pool.id}-ankrftm-apr`, chain: networkContext.chain } },
                        update: { apr: poolAnkrFtmApr },
                        create: {
                            id: `${pool.id}-ankrftm-apr`,
                            chain: networkContext.chain,
                            poolId: pool.id,
                            apr: poolAnkrFtmApr,
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
