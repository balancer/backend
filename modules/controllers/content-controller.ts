import { syncRateProviderReviews } from '../actions/content/sync-rate-providers';
import { syncCategories } from '../actions/content/sync-categories';

export function ContentController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncRateProviderReviews() {
            return await syncRateProviderReviews();
        },
        async syncCategories() {
            await syncCategories();
            return 'OK';
        },
    };
}
