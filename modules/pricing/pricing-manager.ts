import { PriceHandler, PriceItem, TokenPriceData } from './types';

export class PricingManager {
    constructor(
        private readonly handlers: PriceHandler[],
    ) {}

    async calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]> {
        if (tokens.length === 0) {
            return [];
        }

        let remainingTokens = [...tokens];
        const allPriceItems: PriceItem[] = [];

        for (const handler of this.handlers) {
            if (remainingTokens.length === 0) {
                break;
            }

            try {
                const priceItems = await handler.calculatePricesForTokens(remainingTokens);
                allPriceItems.push(...priceItems);

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
