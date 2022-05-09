import { TokenPriceHandler } from '../token-types';
import { prisma } from '../../util/prisma-client';
import _ from 'lodash';
import { timestampRoundedUpToNearestFifteen } from '../../util/time';

export class TokenPriceService {
    constructor(private readonly handlers: TokenPriceHandler[]) {}

    public async loadTokenPrices(): Promise<void> {
        const tokens = await prisma.prismaToken.findMany({
            include: {
                types: true,
                //fetch the last price stored
                prices: { take: 1, orderBy: { timestamp: 'desc' } },
            },
        });

        //order by timestamp ascending, so the tokens at the front of the list are the ones with the oldest timestamp
        //this is for instances where a query gets rate limited and does not finish
        let tokensWithTypes = _.sortBy(tokens, (token) => token.prices[0]?.timestamp || 0).map((token) => ({
            ...token,
            types: token.types.map((type) => type.type),
        }));

        for (const handler of this.handlers) {
            const accepted = await handler.getAcceptedTokens(tokensWithTypes);
            const acceptedTokens = tokensWithTypes.filter((token) => accepted.includes(token.address));
            let updated: string[] = [];

            try {
                updated = await handler.updatePricesForTokens(acceptedTokens);
            } catch (e) {
                if (handler.exitIfFails) {
                    throw e;
                }
            }

            //remove any updated tokens from the list for the next handler
            tokensWithTypes = tokensWithTypes.filter((token) => !updated.includes(token.address));
        }

        await this.updateCandleStickData();
    }

    private async updateCandleStickData() {
        const timestamp = timestampRoundedUpToNearestFifteen();
        const tokenPrices = await prisma.prismaTokenPrice.findMany({ where: { timestamp } });
        let operations: any[] = [];

        for (const tokenPrice of tokenPrices) {
            operations.push(
                prisma.prismaTokenPrice.update({
                    where: { tokenAddress_timestamp: { tokenAddress: tokenPrice.tokenAddress, timestamp } },
                    data: {
                        high: Math.max(tokenPrice.high, tokenPrice.price),
                        low: Math.min(tokenPrice.low, tokenPrice.price),
                    },
                }),
            );
        }

        await prisma.$transaction(operations);
    }
}
