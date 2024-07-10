import { syncMerklRewards } from '../actions/aprs/merkl';

export function AprsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncMerkl() {
            return await syncMerklRewards();
        },
    };
}
