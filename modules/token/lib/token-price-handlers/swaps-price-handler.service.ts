import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import moment from 'moment-timezone';

export class SwapsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'SwapsPriceHandlerService';

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
        let operations: any[] = [];
        const tokensUpdated: string[] = [];
        const timestamp = timestampRoundedUpToNearestHour();
        const tokenAddresses = tokens.map((token) => token.address);
        const swaps = await prisma.prismaPoolSwap.findMany({
            where: {
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
            where: { timestamp, tokenAddress: { in: otherTokenAddresses } },
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
                            where: { tokenAddress_timestamp: { tokenAddress: token.address, timestamp } },
                            update: { price, close: price },
                            create: {
                                tokenAddress: token.address,
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
                            where: { tokenAddress: token.address },
                            update: { price: price },
                            create: {
                                tokenAddress: token.address,
                                timestamp,
                                price,
                            },
                        }),
                    );

                    tokensUpdated.push(token.address);
                }
            }
        }

        await prisma.$transaction(operations);

        return tokensUpdated;
    }
}
