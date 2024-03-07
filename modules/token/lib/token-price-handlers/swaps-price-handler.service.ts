import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour } from '../../../common/time';
import moment from 'moment-timezone';
import _ from 'lodash';
import { tokenAndPrice, updatePrices } from './price-handler-helper';
import { Chain } from '@prisma/client';

export class SwapsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'SwapsPriceHandlerService';

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter(
            (token) =>
                !token.types.includes('BPT') &&
                !token.types.includes('PHANTOM_BPT') &&
                !token.types.includes('LINEAR_WRAPPED_TOKEN'),
        );
    }

    public async updatePricesForTokens(
        tokens: PrismaTokenWithTypes[],
        chains: Chain[],
    ): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        const updated: PrismaTokenWithTypes[] = [];
        const tokenAndPrices: tokenAndPrice[] = [];

        const timestamp = timestampRoundedUpToNearestHour();

        for (const chain of chains) {
            const acceptedTokensForChain = acceptedTokens.filter((token) => token.chain === chain);
            const tokenAddresses = acceptedTokensForChain.map((token) => token.address);

            const swaps = await prisma.prismaPoolSwap.findMany({
                where: {
                    chain: chain,
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
                where: { chain: chain, timestamp, tokenAddress: { in: otherTokenAddresses } },
            });

            for (const token of acceptedTokensForChain) {
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

                        tokenAndPrices.push({
                            address: token.address,
                            chain: token.chain,
                            price: price,
                        });

                        updated.push(token);
                    }
                }
            }
        }

        await updatePrices(this.id, tokenAndPrices, timestamp);

        return updated;
    }
}
