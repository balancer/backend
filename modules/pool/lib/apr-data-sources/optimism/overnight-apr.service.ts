import { isSameAddress } from '@balancer-labs/sdk';
import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { networkConfig } from '../../../../config/network-config';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';

type OvernightApr = {
    value: number;
    date: string;
};

export class OvernightAprService implements PoolAprService {
    private readonly overnightTokens: Record<string, string> = {
        '0xa348700745d249c3b49d2c2acac9a5ae8155f826': 'usd+',
        '0x9e88f7cf6c9fc2895dfaa1b7c21d446ec1749f89': 'dai+',
    };

    constructor(
        private readonly linearPoolFactory: string,
        private readonly overnightAprEndpoint: string,
        private readonly tokenService: TokenService,
    ) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            if (pool.factory !== this.linearPoolFactory || !pool.linearData || !pool.dynamicData) {
                continue;
            }

            const itemId = `${pool.id}-overnight`;

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];

            let apiQueryName;
            for (const token in this.overnightTokens) {
                if (isSameAddress(token, wrappedToken.address)) {
                    apiQueryName = this.overnightTokens[token];
                }
            }

            if (!apiQueryName) {
                continue;
            }

            const { data: aprData } = await axios.get<OvernightApr>(
                `${this.overnightAprEndpoint}/${apiQueryName}/fin-data/avg-apr/week`,
            );

            const mainToken = pool.tokens[linearData.mainIndex];

            const mainTokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * mainTokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? aprData.value * (poolWrappedLiquidity / totalLiquidity) : 0;
            console.log(apr);

            await prisma.prismaPoolAprItem.upsert({
                where: { id: itemId },
                create: {
                    id: itemId,
                    poolId: pool.id,
                    title: `${wrappedToken.token.symbol} APR`,
                    apr,
                    group: 'OVERNIGHT',
                    type: 'LINEAR_BOOSTED',
                },
                update: { apr, group: 'OVERNIGHT', type: 'LINEAR_BOOSTED', title: `${wrappedToken.token.symbol} APR` },
            });
        }
    }
}
