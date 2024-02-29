import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour } from '../../../common/time';
import { Chain } from '@prisma/client';
import { tokenAndPrice, updatePrices } from './price-handler-helper';

export class FallbackHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FallbackHandlerService';

    public async updatePricesForTokens(
        tokens: PrismaTokenWithTypes[],
        chains: Chain[],
    ): Promise<PrismaTokenWithTypes[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const timestampMidnight = timestampEndOfDayMidnight();
        const updated: PrismaTokenWithTypes[] = [];
        const tokenAndPrices: tokenAndPrice[] = [];

        for (const chain of chains) {
            const acceptedTokensForChain = tokens.filter((token) => token.chain === chain);
            const tokenAddresses = acceptedTokensForChain.map((token) => token.address);

            const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
                where: { chain: chain, tokenAddress: { in: tokenAddresses } },
            });

            for (const token of acceptedTokensForChain) {
                const price = tokenPrices.find((tokenPrice) => tokenPrice.tokenAddress === token.address);
                // TODO or shall we do 0 as price?
                if (price) {
                    tokenAndPrices.push({
                        address: token.address,
                        chain: token.chain,
                        price: price.price,
                    });
                    updated.push(token);
                }
            }
        }

        await updatePrices(this.id, tokenAndPrices, timestamp, timestampMidnight);

        return updated;
    }
}
