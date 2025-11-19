import { prisma } from '../../../../prisma/prisma-client';
import { EventController, SnapshotsController } from '../../../controllers';
import { roundToMidnight } from '../../../common/time';

describe('sync snapshot debug', () => {
    test('sync snapshots', async () => {
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

    test('reload snapshots', async () => {
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
});
