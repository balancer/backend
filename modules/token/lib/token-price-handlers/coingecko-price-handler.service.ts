import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { CoingeckoService } from '../../../coingecko/coingecko.service';

export class CoingeckoPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = true;
    public readonly id = 'CoingeckoPriceHandlerService';

    constructor(private readonly weth: string, private readonly coingeckoService: CoingeckoService) {}

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return tokens
            .filter(
                (token) =>
                    !token.types.includes('BPT') &&
                    !token.types.includes('PHANTOM_BPT') &&
                    !token.types.includes('LINEAR_WRAPPED_TOKEN'),
            )
            .map((token) => token.address);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const nativeAsset = tokens.find((token) => token.address === this.weth);
        const tokensUpdated: string[] = [];

        if (nativeAsset) {
            const price = await this.coingeckoService.getNativeAssetPrice();
            const usdPrice = price.usd;

            if (typeof usdPrice === 'undefined') {
                throw new Error('failed to load native asset price');
            }

            await prisma.prismaTokenPrice.upsert({
                where: { tokenAddress_timestamp: { tokenAddress: this.weth, timestamp } },
                update: { price: usdPrice, close: usdPrice },
                create: {
                    tokenAddress: this.weth,
                    timestamp,
                    price: usdPrice,
                    high: usdPrice,
                    low: usdPrice,
                    open: usdPrice,
                    close: usdPrice,
                },
            });

            tokensUpdated.push(this.weth);
        }

        const tokenAddresses = tokens.map((item) => item.address);

        const tokenPricesByAddress = await this.coingeckoService.getTokenPrices(tokenAddresses);

        let operations: any[] = [];
        for (let tokenAddress of Object.keys(tokenPricesByAddress)) {
            const priceUsd = tokenPricesByAddress[tokenAddress].usd;
            const normalizedTokenAddress = tokenAddress.toLowerCase();
            const exists = tokenAddresses.includes(normalizedTokenAddress);
            if (!exists) {
                console.log('skipping token', normalizedTokenAddress);
            }
            if (exists && priceUsd) {
                operations.push(
                    prisma.prismaTokenPrice.upsert({
                        where: { tokenAddress_timestamp: { tokenAddress: normalizedTokenAddress, timestamp } },
                        update: { price: priceUsd, close: priceUsd },
                        create: {
                            tokenAddress: normalizedTokenAddress,
                            timestamp,
                            price: priceUsd,
                            high: priceUsd,
                            low: priceUsd,
                            open: priceUsd,
                            close: priceUsd,
                            coingecko: true,
                        },
                    }),
                );

                operations.push(
                    prisma.prismaTokenCurrentPrice.upsert({
                        where: { tokenAddress: normalizedTokenAddress },
                        update: { price: priceUsd },
                        create: {
                            tokenAddress: normalizedTokenAddress,
                            timestamp,
                            price: priceUsd,
                            coingecko: true,
                        },
                    }),
                );

                tokensUpdated.push(normalizedTokenAddress);
            }
        }

        await Promise.all(operations);

        return tokensUpdated;
    }
}
