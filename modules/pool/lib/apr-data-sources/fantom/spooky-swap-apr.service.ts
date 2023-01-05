import { PoolAprService } from '../../../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { TokenService } from '../../../../token/token.service';

const BOO_TOKEN_ADDRESS = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE'.toLowerCase();

export class SpookySwapAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService) {}

    public getAprServiceName(): string {
        return 'SpookySwapAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const { data } = await axios.get<string>('https://api.spooky.fi/api/xboo', {});
        const xBooApr = parseFloat(data) / 100;
        let operations: any[] = [];

        for (const pool of pools) {
            if (
                !pool.linearData ||
                !pool.dynamicData ||
                pool.tokens[pool.linearData.mainIndex].address !== BOO_TOKEN_ADDRESS
            ) {
                continue;
            }

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, BOO_TOKEN_ADDRESS);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? xBooApr * (poolWrappedLiquidity / totalLiquidity) : 0;

            operations.push(
                prisma.prismaPoolAprItem.upsert({
                    where: { id: `${pool.id}-xboo-apr` },
                    update: { apr, type: 'LINEAR_BOOSTED' },
                    create: {
                        id: `${pool.id}-xboo-apr`,
                        poolId: pool.id,
                        apr,
                        title: 'xBOO boosted APR',
                        type: 'LINEAR_BOOSTED',
                    },
                }),
            );
        }

        await Promise.all(operations);
    }
}
