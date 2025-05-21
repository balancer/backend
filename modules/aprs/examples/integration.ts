import { AprService } from '../';
import { Chain } from '@prisma/client';

/**
 * This example demonstrates how to integrate the new APR module with the existing code.
 * It shows how to:
 * - Run the new implementation for testing/debugging
 * - Gradually migrate specific APR update calls
 * - Compare results between old and new implementations
 */
async function integrationExample(chain: Chain = 'MAINNET', poolId = '0x85b2b559bc2d21104c4defdd6efca8a20343361d') {
    const service = new AprService();

    if (poolId) {
        const items = await service.calculateAprForPool(chain, poolId);

        console.log('\nAPR Items:');
        items.forEach((item) => {
            console.log(`- ${item.title}: ${item.apr}`);
        });
    }
}

// Run the example
// Uncomment to run:
integrationExample(process.argv[2] as Chain, process.argv[3]).catch(console.error);
