import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';

export class FallbackPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FallbackHandlerService';

    async calculatePricesForTokens(
        tokens: TokenPriceData[],
        allPrices?: Map<string, { price: number; updatedBy: string }>,
    ): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        if (!allPrices || allPrices.size === 0) {
            return [];
        }

        try {
            const priceItems: PriceItem[] = [];

            // Create price items for tokens that have prices in allPrices map
            for (const token of acceptedTokens) {
                if (allPrices.has(token.address)) {
                    const price = allPrices.get(token.address)!;
                    priceItems.push({
                        address: token.address,
                        chain: token.chain,
                        price: price.price,
                        updatedAt: new Date(),
                        updatedBy: this.id,
                    });
                }
            }

            return priceItems;
        } catch (error) {
            console.error('FallbackPriceHandler: Error calculating prices:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        // Accept all tokens - this is a fallback handler that uses existing database prices
        return tokens;
    }
}
