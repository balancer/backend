import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { CoingeckoService } from '../../../coingecko/coingecko.service';
import { networkContext } from '../../../network/network-context.service';

export class CoingeckoPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = true;
    public readonly id = 'CoingeckoPriceHandlerService';

    constructor(private readonly coingeckoService: CoingeckoService) {}

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return tokens
            .filter(
                (token) =>
                    !token.types.includes('BPT') &&
                    !token.types.includes('PHANTOM_BPT') &&
                    !token.types.includes('LINEAR_WRAPPED_TOKEN') &&
                    !token.coingeckoTokenId &&
                    !networkContext.data.coingecko.excludedTokenAddresses.includes(token.address),
            )
            .map((token) => token.address);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const tokensUpdated: string[] = [];

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
                        where: {
                            tokenAddress_timestamp_chain: {
                                tokenAddress: normalizedTokenAddress,
                                timestamp,
                                chain: networkContext.chain,
                            },
                        },
                        update: { price: priceUsd, close: priceUsd },
                        create: {
                            tokenAddress: normalizedTokenAddress,
                            chain: networkContext.chain,
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
                        where: {
                            tokenAddress_chain: { tokenAddress: normalizedTokenAddress, chain: networkContext.chain },
                        },
                        update: { price: priceUsd },
                        create: {
                            tokenAddress: normalizedTokenAddress,
                            chain: networkContext.chain,
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
