import { Chain } from '@prisma/client';
import config from '../../config';
import { CoingeckoDataService } from '../token/lib/coingecko-data.service';
import { syncBlockedBuffers } from './lib/sync-erc4626-blocked-buffers';
import { syncErc4626Reviews } from './lib/sync-erc4626-reviews';
import { syncHookReviews } from './lib/sync-hook-reviews';
import { syncRateProviderReviews } from './lib/sync-rate-provider-reviews';
import { syncTags } from './lib/sync-tags';
import { syncTokenContentData } from './lib/sync-token-data';
import { prisma } from '../../prisma/prisma-client';
import { getFeaturedPools } from './lib/get-featured-pools';

export function ContentController() {
    return {
        async syncRateProviderReviews() {
            return syncRateProviderReviews();
        },
        async syncHookReviews() {
            return syncHookReviews();
        },
        async syncErc4626Data() {
            await syncBlockedBuffers();
            return syncErc4626Reviews();
        },
        async syncCategories() {
            await syncTags();
            return 'OK';
        },
        async syncTokenContentData() {
            // sync sepolia only in non-production envs
            const chains = Object.keys(config).filter(
                (chain) => (process.env.DEPLOYMENT_ENV === 'production' && chain !== 'SEPOLIA') || true,
            ) as Chain[];

            //sync coingecko Ids first, then override Ids from the content service
            await new CoingeckoDataService().syncCoingeckoIds();
            await syncTokenContentData(chains);
        },
        async reloadAllTokenTypes(chain: Chain) {
            await prisma.prismaTokenType.deleteMany({
                where: { chain },
            });

            await syncTokenContentData([chain]);
        },
        async getFeaturedPools(chains: Chain[]) {
            return getFeaturedPools(chains);
        },
    };
}
