import { prisma } from '../../prisma/prisma-client';
import { Chain } from '@prisma/client';
import { CoingeckoDataService } from './lib/coingecko-data.service';

export const latestTokenPrice = async (chain: Chain, tokenAddresses: string[]) => {
    const lowerCaseAddresses = tokenAddresses.map((a) => a.toLowerCase());
    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain,
                tokenAddress: {
                    in: lowerCaseAddresses,
                },
            },
        })
        .then((arr) =>
            arr.reduce(
                (obj, item) => {
                    obj[item.tokenAddress] = item.price;

                    return obj;
                },
                {} as Record<string, number>,
            ),
        );

    const missingPrices = lowerCaseAddresses.filter((tokenAddress) => !prices[tokenAddress]);

    if (missingPrices.length > 0) {
        const cg = new CoingeckoDataService();
        const coingeckoPrices = await cg.tokenPrice(chain, missingPrices);

        for (const token of Object.keys(coingeckoPrices)) {
            const price = coingeckoPrices[token];

            prices[token] = price.usd;
        }
    }

    return prices;
};
