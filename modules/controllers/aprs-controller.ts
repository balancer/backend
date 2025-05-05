import { Chain } from '@prisma/client';
import { syncMerklRewards } from '../actions/aprs/merkl';
import { SwapFeeFromSnapshotsAprService } from '../pool/lib/apr-data-sources/swap-fee-apr-from-snapshots.service';
import { prisma } from '../../prisma/prisma-client';
import { poolsIncludeForAprs } from '../../prisma/prisma-types';

export function AprsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncMerkl() {
            return await syncMerklRewards();
        },
        async update7And30DaysSwapAprs(chain: Chain) {
            const service = new SwapFeeFromSnapshotsAprService();
            const pools = await prisma.prismaPool.findMany({
                ...poolsIncludeForAprs,
                where: { chain },
            });
            await service.updateAprForPools(pools);
            return 'Done';
        },
    };
}
