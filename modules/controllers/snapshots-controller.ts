import { Chain } from '@prisma/client';
import { reloadSnapshots, syncSnapshots } from '../actions/pool/sync-snapshots';

export function SnapshotsController() {
    return {
        async syncSnapshots(chain: Chain) {
            return await syncSnapshots(chain);
        },
        async reloadSnapshotsForPool(poolId: string, chain: Chain) {
            await reloadSnapshots(chain, poolId);
        },
    };
}
