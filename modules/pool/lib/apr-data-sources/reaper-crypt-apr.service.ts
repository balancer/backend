import axios from 'axios';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { TokenService } from '../../../token/token.service';
import { PoolAprService } from '../../pool-types';
import { ReaperCrypt } from './apr-types';

export class ReaperCryptAprService implements PoolAprService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly reaperCryptsEndpoint: string,
        private readonly cryptsOverrides: Record<string, string> = {},
    ) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const { data } = await axios.get<{ data: ReaperCrypt[] }>(this.reaperCryptsEndpoint);
        const crypts = data.data;
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            const itemId = `${pool.id}-reaper-crypt`;

            if (!pool.linearData || !pool.dynamicData) {
                continue;
            }

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];
            const cryptAddress = this.cryptsOverrides[wrappedToken.address] ?? wrappedToken.address;

            const crypt = crypts.find(
                (crypt) => crypt.cryptContent.vault.address.toLowerCase() === cryptAddress.toLowerCase(),
            );

            if (!crypt) {
                continue;
            }
            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? crypt.analytics.yields.year * (poolWrappedLiquidity / totalLiquidity) : 0;

            await prisma.prismaPoolAprItem.upsert({
                where: { id: itemId },
                create: {
                    id: itemId,
                    poolId: pool.id,
                    title: `${crypt.cryptContent.symbol} APR`,
                    apr,
                    group: 'REAPER',
                    type: 'LINEAR_BOOSTED',
                },
                update: { apr },
            });
        }
    }
}
