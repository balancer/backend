import { prisma } from '../../prisma/prisma-client';
import { poolService } from '../pool/pool.service';
import { PoolController } from './pool-controller';

describe('pool controller debugging', () => {
    it('delete reload v3 pools', async () => {
        await prisma.prismaPool.deleteMany({
            where: {
                protocolVersion: 3,
            },
        });

        let pools = await poolService.getGqlPools({ where: { chainIn: ['SEPOLIA'], protocolVersionIn: [3] } });

        expect(pools.length).toBe(0);

        await PoolController().reloadPoolsV3('11155111');

        pools = await poolService.getGqlPools({ where: { chainIn: ['SEPOLIA'], protocolVersionIn: [3] } });

        expect(pools.length).toBeGreaterThan(0);
    }, 5000000);
});
