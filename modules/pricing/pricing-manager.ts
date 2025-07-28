import { PriceHandler, PriceItem, TokenPriceData } from './types';

export class PricingManager {
    constructor(
        private readonly handlers: PriceHandler[],
    ) {}

    async calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]> {
        if (tokens.length === 0) {
            return [];
        }

        // Build initial price map from tokens' currentPrice
        const allPrices = new Map<string, number>();
        tokens.forEach(token => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        let remainingTokens = [...tokens];
        const allPriceItems: PriceItem[] = [];

        for (const handler of this.handlers) {
            if (remainingTokens.length === 0) {
                break;
            }

            try {
                const priceItems = await handler.calculatePricesForTokens(remainingTokens, allPrices);
                allPriceItems.push(...priceItems);

                // Update allPrices map with new prices from this handler
                priceItems.forEach(item => {
                    allPrices.set(item.address, item.price);
                });

                // Remove successfully priced tokens from remaining tokens
                const pricedAddresses = new Set(priceItems.map((item) => item.address));
                remainingTokens = remainingTokens.filter((token) => !pricedAddresses.has(token.address));
            } catch (error) {
                console.error(`Price handler ${handler.id} failed:`, error);

                if (handler.exitIfFails) {
                    throw error;
                }
            }
        }

        return allPriceItems;
    }
}
