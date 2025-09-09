import { AprService } from '../';
import { Chain } from '@prisma/client';

async function calculationExample(chain: Chain = 'SONIC', poolId = '0x790fd3e9b42a3955cb1b286fbfa1ac67043a69ef') {
    const service = new AprService();

    if (poolId) {
        await service.updateAprForPool(chain, poolId);
    }
}

// Run the example
calculationExample(process.argv[2] as Chain, process.argv[3])
    .catch(console.error)
    .finally(() => process.exit(0));
