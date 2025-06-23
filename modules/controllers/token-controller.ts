import { Chain } from '@prisma/client';
import { syncErc4626Tokens } from '../actions/token/sync-erc4626-tokens';
import { getViemClient } from '../sources/viem-client';
import { syncErc4626MaxValues } from '../actions/token/sync-erc4626-max-values';
import { syncErc4626UnwrapRates } from '../actions/token/sync-erc4626-unwrap-rates';

export function TokenController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncErc4626Tokens(chain: Chain) {
            const viemClient = getViemClient(chain);
            await syncErc4626Tokens(viemClient, chain);
        },
        async syncErc4626OnChainData(chain: Chain) {
            await syncErc4626UnwrapRates(chain);
            await syncErc4626MaxValues(chain);
        },
    };
}
