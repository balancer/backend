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
        //these should always be stored in all lowercase
        '0xa348700745d249c3b49d2c2acac9a5ae8155f826': 'usd+',
        '0x9e88f7cf6c9fc2895dfaa1b7c21d446ec1749f89': 'dai+',
    };
    private readonly wrappedTokenAddresses = Object.keys(this.overnightTokens);

    constructor(private readonly overnightAprEndpoint: string, private readonly tokenService: TokenService) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const overnightLinearPools = pools.filter(
            (pool) =>
                pool.type === 'LINEAR' &&
                pool.tokens.some((token) => this.wrappedTokenAddresses.includes(token.address)),
        );

        for (const pool of overnightLinearPools) {
            if (!pool.linearData || !pool.dynamicData) {
                continue;
            }

            const itemId = `${pool.id}-overnight`;

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const apiQuerySlug = this.overnightTokens[wrappedToken.token.address];

            const { data: aprData } = await axios.get<OvernightApr>(
                `${this.overnightAprEndpoint}/${apiQuerySlug}/fin-data/avg-apr/week`,
            );

            const mainToken = pool.tokens[linearData.mainIndex];

            const mainTokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * mainTokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? aprData.value * (poolWrappedLiquidity / totalLiquidity) : 0;

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
