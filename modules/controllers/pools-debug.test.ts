import { prisma } from '../../prisma/prisma-client';
import { poolService } from '../pool/pool.service';
import { CowAmmController } from './cow-amm-controller';
import { PoolController } from './v3';

describe('pool controller debugging', () => {
    it('delete reload v3 pools', async () => {
        await prisma.prismaPool.deleteMany({
            where: {
                protocolVersion: 3,
            },
        });

        let pools = await poolService.getGqlPools({ where: { chainIn: ['SEPOLIA'], protocolVersionIn: [3] } });

        expect(pools.length).toBe(0);

        await PoolController().reloadPoolsV3('SEPOLIA');

        pools = await poolService.getGqlPools({ where: { chainIn: ['SEPOLIA'], protocolVersionIn: [3] } });

        expect(pools.length).toBeGreaterThan(0);
    }, 5000000);

    it('update surplus apr', async () => {
        await CowAmmController().addPools('MAINNET');
        // await CowAmmController().addPools('MAINNET');
        await CowAmmController().syncSwaps('MAINNET');
        // await CowAmmController().syncSwaps('MAINNET');
        await CowAmmController().syncJoinExits('MAINNET');
        await CowAmmController().updateVolumeAndFees('MAINNET');
        await CowAmmController().updateSurplusAprs();
    }, 5000000);

    it('cow snapshots', async () => {
        await CowAmmController().addPools('MAINNET');
        // await CowAmmController().addPools('MAINNET');
        await CowAmmController().syncSwaps('MAINNET');
        // await CowAmmController().syncSwaps('MAINNET');
        await CowAmmController().syncJoinExits('MAINNET');
        await CowAmmController().updateVolumeAndFees('MAINNET');
        await CowAmmController().syncSnapshots('MAINNET');
        await CowAmmController().updateSurplusAprs();
    }, 5000000);

    describe('pool debugging', () => {
        it('reload pools', async () => {
            //only do once before starting to debug
            // await poolService.syncAllPoolsFromSubgraph();
            // await poolService.syncChangedPools();
            await PoolController().reloadPoolsV3('SEPOLIA');
        }, 5000000);
    });
});
