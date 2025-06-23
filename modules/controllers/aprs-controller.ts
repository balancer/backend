import { Chain } from '@prisma/client';
import { AprService } from '../aprs';
import { syncIncentivizedCategory } from '../actions/pool/sync-incentivized-category';

export function AprsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async updateAprsAndIncentivizedCategory(chain: Chain) {
            const aprService = new AprService();
            await aprService.updateAprs(chain);
            await syncIncentivizedCategory(chain);
        },
        async reloadAprsAndIncentivizedCategory(chain: Chain) {
            const aprService = new AprService();
            await aprService.reloadAprs(chain);
            await syncIncentivizedCategory(chain);
        },
    };
}
