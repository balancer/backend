import { AprService } from '../';
import { Chain } from '@prisma/client';

async function calculationExample(
    chain: Chain = 'MAINNET',
    poolId = '0x3de27efa2f1aa663ae5d458857e731c129069f29000200000000000000000588',
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
