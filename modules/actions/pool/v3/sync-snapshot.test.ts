import { prisma } from '../../../../prisma/prisma-client';
import { EventController, SnapshotsController } from '../../../controllers';
import { roundToMidnight } from '../../../common/time';

describe('sync snapshot debug', () => {
    test('sync snapshots sonic', async () => {
        const chain = 'SONIC';

        // update swap events
        await EventController().syncSwapsV3(chain);
        await EventController().syncSwapsUpdateVolumeAndFeesV2(chain);

        await SnapshotsController().syncSnapshots(chain);

        const dbPool = await prisma.prismaPool.findFirst({
            where: {
                chain,
            },
            select: {
                snapshots: true,
            },
        });

        const latestSnapshot = (dbPool?.snapshots as any[]).sort((a, b) => b.timestamp - a.timestamp)[0];

        expect(latestSnapshot).toBeDefined();
        expect(latestSnapshot.timestamp).toBe(roundToMidnight(Math.floor(Date.now() / 1000)));
    }, 5000000);

    test('sync snapshots mainnet', async () => {
        const chain = 'MAINNET';

        // update swap events
        await EventController().syncSwapsV3(chain);
        await EventController().syncSwapsUpdateVolumeAndFeesV2(chain);

        await SnapshotsController().syncSnapshots(chain);

        const dbPool = await prisma.prismaPool.findFirst({
            where: {
                chain,
            },
            select: {
                snapshots: true,
            },
        });

        const latestSnapshot = (dbPool?.snapshots as any[]).sort((a, b) => b.timestamp - a.timestamp)[0];

        expect(latestSnapshot).toBeDefined();
        expect(latestSnapshot.timestamp).toBe(roundToMidnight(Math.floor(Date.now() / 1000)));
    }, 5000000);

    test('reload snapshot v2', async () => {
        const chain = 'SONIC';

        // update swap events
        await EventController().syncSwapsV3(chain);
        await EventController().syncSwapsUpdateVolumeAndFeesV2(chain);

        await SnapshotsController().reloadSnapshotsForPool(
            '0x10ac2f9dae6539e77e372adb14b1bf8fbd16b3e8000200000000000000000005',
            chain,
        );

        const dbPool = await prisma.prismaPool.findFirst({
            where: {
                chain,
                id: '0x10ac2f9dae6539e77e372adb14b1bf8fbd16b3e8000200000000000000000005',
            },
            select: {
                snapshots: true,
            },
        });

        const latestSnapshot = (dbPool?.snapshots as any[]).sort((a, b) => b.timestamp - a.timestamp)[0];

        expect(latestSnapshot).toBeDefined();
        expect(latestSnapshot.timestamp).toBe(roundToMidnight(Math.floor(Date.now() / 1000)));
    }, 5000000);
    test('reload snapshot v3', async () => {
        const chain = 'SONIC';

        // update swap events
        await EventController().syncSwapsV3(chain);
        await EventController().syncSwapsUpdateVolumeAndFeesV2(chain);

        await SnapshotsController().reloadSnapshotsForPool('0x43026d483f42fb35efe03c20b251142d022783f2', chain);

        const dbPool = await prisma.prismaPool.findFirst({
            where: {
                chain,
                id: '0x43026d483f42fb35efe03c20b251142d022783f2',
            },
            select: {
                snapshots: true,
            },
        });

        const latestSnapshot = (dbPool?.snapshots as any[]).sort((a, b) => b.timestamp - a.timestamp)[0];

        expect(latestSnapshot).toBeDefined();
        expect(latestSnapshot.timestamp).toBe(roundToMidnight(Math.floor(Date.now() / 1000)));
    }, 5000000);
    test('reload snapshot cow', async () => {
        const chain = 'MAINNET';

        // update swap events
        await EventController().syncSwapsV3(chain);
        await EventController().syncSwapsUpdateVolumeAndFeesV2(chain);

        await SnapshotsController().reloadSnapshotsForPool('0xf08d4dea369c456d26a3168ff0024b904f2d8b91', chain);

        const dbPool = await prisma.prismaPool.findFirst({
            where: {
                chain,
                id: '0xf08d4dea369c456d26a3168ff0024b904f2d8b91',
            },
            select: {
                snapshots: true,
            },
        });

        const latestSnapshot = (dbPool?.snapshots as any[]).sort((a, b) => b.timestamp - a.timestamp)[0];

        expect(latestSnapshot).toBeDefined();
        expect(latestSnapshot.timestamp).toBe(roundToMidnight(Math.floor(Date.now() / 1000)));
    }, 5000000);
});
