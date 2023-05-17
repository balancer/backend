import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes, PrismaTokenWithTypesAndPrices } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import moment from 'moment-timezone';
import { networkContext } from '../../../network/network-context.service';
import _ from 'lodash';

export class SwapsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'SwapsPriceHandlerService';

    public async getAcceptedTokens(tokens: PrismaTokenWithTypesAndPrices[]): Promise<string[]> {
        // also update any tokens with a coingecko ID that haven't been updated for three hours. This is a fall back to coingecko pricing.
        const threeHoursAgo = moment().subtract(3, 'hours').utc().unix();

        // get the most recent price in front
        tokens.forEach((token) => (token.prices = _.orderBy(token.prices, 'timestamp', 'desc')));

        return tokens
            .filter(
                (token) =>
                    !token.types.includes('BPT') &&
                    !token.types.includes('PHANTOM_BPT') &&
                    !token.types.includes('LINEAR_WRAPPED_TOKEN') &&
                    (!token.coingeckoTokenId || !token.prices.length || token.prices[0].timestamp < threeHoursAgo),
            )
            .map((token) => token.address);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        let operations: any[] = [];
        const tokensUpdated: string[] = [];
        const timestamp = timestampRoundedUpToNearestHour();
        const tokenAddresses = tokens.map((token) => token.address);
        const swaps = await prisma.prismaPoolSwap.findMany({
            where: {
                chain: networkContext.chain,
                timestamp: { gt: moment().unix() - 900 }, //only search for the last 15 minutes
                OR: [{ tokenIn: { in: tokenAddresses } }, { tokenOut: { in: tokenAddresses } }],
            },
            orderBy: { timestamp: 'desc' },
        });
        const otherTokenAddresses = [
            ...swaps.filter((swap) => !tokenAddresses.includes(swap.tokenIn)).map((swap) => swap.tokenIn),
            ...swaps.filter((swap) => !tokenAddresses.includes(swap.tokenOut)).map((swap) => swap.tokenOut),
        ];
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            where: { chain: networkContext.chain, timestamp, tokenAddress: { in: otherTokenAddresses } },
        });

        for (const token of tokens) {
            const tokenSwaps = swaps.filter(
                (swap) => swap.tokenIn === token.address || swap.tokenOut === token.address,
            );

            for (const tokenSwap of tokenSwaps) {
                const tokenSide: 'token-in' | 'token-out' =
                    tokenSwap.tokenIn === token.address ? 'token-in' : 'token-out';
                const tokenAmount = parseFloat(
                    tokenSide === 'token-in' ? tokenSwap.tokenAmountIn : tokenSwap.tokenAmountOut,
                );
                const otherToken = tokenSide === 'token-in' ? tokenSwap.tokenOut : tokenSwap.tokenIn;
                const otherTokenAmount = parseFloat(
                    tokenSide === 'token-in' ? tokenSwap.tokenAmountOut : tokenSwap.tokenAmountIn,
                );
                const otherTokenPrice = tokenPrices.find((tokenPrice) => tokenPrice.tokenAddress === otherToken);

                if (otherTokenPrice) {
                    const otherTokenValue = otherTokenPrice.price * otherTokenAmount;
                    const price = otherTokenValue / tokenAmount;

                    operations.push(
                        prisma.prismaTokenPrice.upsert({
                            where: {
                                tokenAddress_timestamp_chain: {
                                    tokenAddress: token.address,
                                    timestamp,
                                    chain: networkContext.chain,
                                },
                            },
                            update: { price, close: price },
                            create: {
                                tokenAddress: token.address,
                                chain: networkContext.chain,
                                timestamp,
                                price,
                                high: price,
                                low: price,
                                open: price,
                                close: price,
                            },
                        }),
                    );

                    operations.push(
                        prisma.prismaTokenCurrentPrice.upsert({
                            where: {
                                tokenAddress_chain: {
                                    tokenAddress: token.address,
                                    chain: networkContext.chain,
                                },
                            },
                            update: { price: price },
                            create: {
                                tokenAddress: token.address,
                                chain: networkContext.chain,
                                timestamp,
                                price,
                            },
                        }),
                    );

                    tokensUpdated.push(token.address);
                }
            }
        }

        await Promise.all(operations);

        return tokensUpdated;
    }
}
