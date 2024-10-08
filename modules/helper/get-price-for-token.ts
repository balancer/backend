import { Chain, PrismaTokenCurrentPrice } from '@prisma/client';

export function getPriceForToken(tokenPrices: PrismaTokenCurrentPrice[], tokenAddress: string, chain: Chain): number {
    const tokenPrice = tokenPrices.find(
        (tokenPrice) =>
            tokenPrice.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() && tokenPrice.chain === chain,
    );

    return tokenPrice?.price || 0;
}
