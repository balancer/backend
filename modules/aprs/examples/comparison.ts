import { AprService } from '../';
import { poolService } from '../../pool/pool.service';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

async function comparisonExample(chain: Chain = 'MAINNET', poolId = '0x85b2b559bc2d21104c4defdd6efca8a20343361d') {
    // New implementation
    const newAprService = new AprService();

    console.log('Calculating APR with new implementation (no DB writes)...');

    const items = await newAprService.calculateAprForPool(chain, poolId);

    console.log('\nAPR Items from new implementation:');
    items.forEach((item) => {
        console.log(`- ${item.title}: ${item.apr}`);
    });

    // Old implementation
    await poolService.updatePoolAprs(chain);
    const oldItems = await prisma.prismaPoolAprItem.findMany({ where: { poolId } });

    oldItems.forEach((item) => {
        console.log(`- ${item.title}: ${item.apr}`);
    });
}

// Run the example
// Uncomment to run:
comparisonExample().catch(console.error);
