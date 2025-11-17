import { AprService } from '../';
import { Chain } from '@prisma/client';

async function calculationExample(
    chain: Chain = 'POLYGON',
    poolId = '0xe2f706ef1f7240b803aae877c9c762644bb808d80002000000000000000008c2',
) {
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
calculationExample(process.argv[2] as Chain, process.argv[3])
    .catch(console.error)
    .finally(() => process.exit(0));
