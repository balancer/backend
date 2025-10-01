import { Chain } from '@prisma/client';
import { PricingManager } from './pricing-manager';
import { PricingRepository } from './pricing-repository';
import { createHandlers } from './create-handlers';
import { eventsRepository } from '../events/events-repository';

/**
 * Example usage of PricingManager with mock token data
 * This demonstrates how to use the manager directly to get token prices
 */
async function exampleUsage() {
    // Create handlers for mainnet
    const handlers = createHandlers([Chain.MAINNET]);

    // Create manager
    const manager = new PricingManager(handlers);

    // Fetch tokens for pricing
    const repo = new PricingRepository(eventsRepository);
    const tokens = await repo.getTokensForPricing(Chain.MAINNET, [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Underlying
        '0xd4fa2d31b7968e448877f69a96de69f5de8cd23e', // ERC4626 aave token
        '0x7204b7dbf9412567835633b6f00c3edc3a8d6330', // Morpho token
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        '0x1202f5c7b4b9e47a1a484e8b270be34dbbc75055', // wstusr - ERC4626
    ]);

    console.log('Starting price calculation for tokens:');
    tokens.forEach((token) => {
        console.log(`- ${token.address} (${token.types.join(', ')})`);
    });

    try {
        // Calculate prices using the manager
        const priceItems = await manager.calculatePricesForTokens(tokens);

        console.log('\nCalculated prices:');
        priceItems.forEach((item) => {
            console.log(`${item.address}: $${item.price.toFixed(6)} (${item.updatedBy})`);
        });

        // Show which tokens were successfully priced
        const pricedAddresses = new Set(priceItems.map((item) => item.address));
        const unpricedTokens = tokens.filter((token) => !pricedAddresses.has(token.address));

        if (unpricedTokens.length > 0) {
            console.log('\nTokens that could not be priced:');
            unpricedTokens.forEach((token) => {
                console.log(`- ${token.address} (${token.types.join(', ')})`);
            });
        }

        return priceItems;
    } catch (error) {
        console.error('Error calculating prices:', error);
        throw error;
    }
}

// Export for use in tests or other modules
export { exampleUsage };

// Run example if this file is executed directly
if (require.main === module) {
    exampleUsage()
        .then(() => console.log('\nExample completed successfully!'))
        .catch((error) => {
            console.error('Example failed:', error);
            process.exit(1);
        });
}
