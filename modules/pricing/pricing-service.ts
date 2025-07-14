import { Chain } from '@prisma/client';
import { PricingManager } from './pricing-manager';
import { PricingRepository } from './pricing-repository';
import { PriceItem } from './types';
import { createHandlers } from './create-handlers';

export class PricingService {
    private repository: PricingRepository;
    private manager: PricingManager;

    constructor(chains: Chain[]) {
        this.repository = new PricingRepository();
        const handlers = createHandlers(chains);
        this.manager = new PricingManager(handlers);
    }

    async updatePrices(
        chain: Chain,
        tokenAddresses?: string[],
        calculateOnly?: boolean,
    ): Promise<{
        updatedTokenAddresses: string[];
        priceItems: PriceItem[];
    }> {
        const tokens = await this.repository.getTokensForPricing(chain, tokenAddresses);

        if (tokens.length === 0) {
            return { updatedTokenAddresses: [], priceItems: [] };
        }

        const priceItems = await this.manager.calculatePricesForTokens(tokens);

        let updatedTokenAddresses: string[] = [];

        if (!calculateOnly && priceItems.length > 0) {
            updatedTokenAddresses = await this.repository.updatePrices(priceItems);
        }

        return {
            updatedTokenAddresses,
            priceItems,
        };
    }

    async calculatePrices(
        chain: Chain,
        tokenAddresses?: string[],
    ): Promise<{
        updatedTokenAddresses: string[];
        priceItems: PriceItem[];
    }> {
        return this.updatePrices(chain, tokenAddresses, true);
    }
}
