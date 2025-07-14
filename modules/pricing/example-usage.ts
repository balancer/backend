import { Chain } from '@prisma/client';
import { PricingManager } from './pricing-manager';
import { TokenPriceData } from './types';
import { createHandlers } from './create-handlers';

/**
 * Example usage of PricingManager with mock token data
 * This demonstrates how to use the manager directly to get token prices
 */
async function exampleUsage() {
    // Create handlers for mainnet
    const handlers = createHandlers([Chain.MAINNET]);

    // Create manager
    const manager = new PricingManager(handlers);

    // Mock token data based on actual database entries
    const tokens: TokenPriceData[] = [
        // Aave token - will be handled by AavePriceHandler
        {
            address: '0x57d20c946a7a3812a7225b881cdcd8431d23431c',
            chain: Chain.MAINNET,
            coingeckoTokenId: undefined, // No coingecko ID
            excludedFromCoingecko: false,
            types: ['WHITE_LISTED'],
            underlyingTokenAddress: undefined,
            unwrapRate: undefined,
            underlyingTokenPrice: 1.01,
        },

        // WETH token - will be handled by CoingeckoPriceHandler
        {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            chain: Chain.MAINNET,
            coingeckoTokenId: 'weth',
            excludedFromCoingecko: false,
            types: ['WHITE_LISTED'],
            underlyingTokenAddress: undefined,
            unwrapRate: undefined,
            underlyingTokenPrice: undefined,
        },

        // ERC4626 token - will be handled by ERC4626PriceHandler
        {
            address: '0x1202f5c7b4b9e47a1a484e8b270be34dbbc75055',
            chain: Chain.MAINNET,
            coingeckoTokenId: 'resolv-wstusr', // Has coingecko ID but ERC4626 handler will process it first
            excludedFromCoingecko: false,
            types: ['ERC4626', 'WHITE_LISTED'],
            underlyingTokenAddress: '0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110',
            unwrapRate: '1.092541737468752984', // Current unwrap rate from database
            underlyingTokenPrice: 0.999787, // Current price from database
        },
    ];

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
