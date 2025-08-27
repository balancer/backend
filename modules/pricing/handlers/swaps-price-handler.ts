import { PriceHandler, TokenPriceData, PriceItem } from '../types';

export class SwapsPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'SwapsPriceHandlerService';

    async calculatePricesForTokens(
        tokens: TokenPriceData[],
        allPrices: Map<string, { price: number; updatedBy: string }>,
    ): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        const priceItems: PriceItem[] = [];

        for (const token of acceptedTokens) {
            if (!token.latestSwaps || token.latestSwaps.length === 0) {
                continue;
            }

            for (const tokenSwap of token.latestSwaps) {
                const tokenSide: 'token-in' | 'token-out' =
                    tokenSwap.payload.tokenIn.address === token.address ? 'token-in' : 'token-out';

                const tokenAmount = parseFloat(
                    tokenSide === 'token-in' ? tokenSwap.payload.tokenIn.amount : tokenSwap.payload.tokenOut.amount,
                );

                const otherTokenAddress =
                    tokenSide === 'token-in' ? tokenSwap.payload.tokenOut.address : tokenSwap.payload.tokenIn.address;

                const otherTokenAmount = parseFloat(
                    tokenSide === 'token-in' ? tokenSwap.payload.tokenOut.amount : tokenSwap.payload.tokenIn.amount,
                );

                // Use allPrices map to find other token price (from existing prices OR previous handler results)
                const otherTokenPrice = allPrices.get(otherTokenAddress);

                if (
                    otherTokenPrice &&
                    otherTokenPrice.updatedBy !== this.id &&
                    otherTokenPrice.updatedBy !== 'FallbackHandlerService'
                ) {
                    const otherTokenValue = otherTokenPrice.price * otherTokenAmount;
                    if (otherTokenValue > 1) {
                        const price = otherTokenValue / tokenAmount;
                        // New price cant be more than 10x of old price. Assume 10x increase in pricing is inflated and skip.
                        if (!token.currentPrice || token.currentPrice * 10 > price) {
                            priceItems.push({
                                address: token.address,
                                chain: token.chain,
                                price: price,
                                updatedAt: new Date(),
                                updatedBy: this.id,
                            });
                        }
                    }
                }
            }
        }

        return priceItems;
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter(
            (token) =>
                !token.types.includes('BPT') &&
                !token.types.includes('PHANTOM_BPT') &&
                token.latestSwaps &&
                token.latestSwaps.length > 0,
        );
    }
}
