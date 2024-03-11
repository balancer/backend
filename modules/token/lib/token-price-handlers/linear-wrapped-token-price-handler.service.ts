import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { LinearData } from '../../../pool/subgraph-mapper';
import { tokenAndPrice, updatePrices } from './price-handler-helper';
import { Chain } from '@prisma/client';

export class LinearWrappedTokenPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'LinearWrappedTokenPriceHandlerService';

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter((token) => token.types.includes('LINEAR_WRAPPED_TOKEN'));
    }

    public async updatePricesForTokens(
        tokens: PrismaTokenWithTypes[],
        chains: Chain[],
    ): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        const tokensUpdated: PrismaTokenWithTypes[] = [];
        const tokenAndPrices: tokenAndPrice[] = [];
        const timestamp = timestampRoundedUpToNearestHour();

        const pools = await prisma.prismaPool.findMany({
            where: {
                type: 'LINEAR',
                chain: { in: chains },
                categories: { none: { category: 'BLACK_LISTED' } },
            },
            include: { tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true } } },
        });
        const mainTokenPrices = await prisma.prismaTokenPrice.findMany({
            where: {
                chain: { in: chains },
                tokenAddress: {
                    in: pools.map((pool) => pool.tokens[(pool.typeData as LinearData)?.mainIndex || 0].address),
                },
                timestamp,
            },
        });

        for (const token of acceptedTokens) {
            const pool = pools.find(
                (pool) =>
                    (pool.typeData as LinearData) &&
                    token.address === pool.tokens[(pool.typeData as LinearData).wrappedIndex].address,
            );
            const linearData = pool?.typeData as LinearData;

            if (pool && linearData) {
                const mainToken = pool.tokens[linearData.mainIndex];
                const wrappedToken = pool.tokens[linearData.wrappedIndex];
                const mainTokenPrice = mainTokenPrices.find(
                    (tokenPrice) => tokenPrice.tokenAddress == mainToken.address,
                );

                if (mainTokenPrice && wrappedToken.dynamicData) {
                    const price = mainTokenPrice.price * parseFloat(wrappedToken.dynamicData.priceRate);

                    tokenAndPrices.push({ address: token.address, chain: token.chain, price: price });

                    tokensUpdated.push(token);
                }
            }
        }

        await updatePrices(this.id, tokenAndPrices, timestamp);

        return tokensUpdated;
    }
}
