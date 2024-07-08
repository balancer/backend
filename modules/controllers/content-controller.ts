import { syncRateProviderReviews } from '../actions/content/sync-rate-providers';

export function ContentController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncRateProviderReviews() {
            return await syncRateProviderReviews();
        },
    };
}
