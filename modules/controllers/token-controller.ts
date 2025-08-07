import { Chain } from '@prisma/client';
import { syncErc4626Tokens } from '../actions/token/sync-erc4626-tokens';
import { syncTvl } from '../actions/token/sync-tvl';
import { getViemClient } from '../sources/viem-client';
import { syncErc4626OnchainData } from '../actions/token/sync-erc4626-onchain-data';
import config from '../../config';

export function TokenController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncErc4626Tokens(chain: Chain) {
            const viemClient = getViemClient(chain);
            await syncErc4626Tokens(viemClient, chain);
        },
        async syncErc4626OnChainData(chain: Chain) {
            const vaultAddress = config[chain].balancer.v3.vaultAddress;
            if (!vaultAddress) {
                return;
            }
            const viemClient = getViemClient(chain);
            await syncErc4626OnchainData(vaultAddress, viemClient, chain);
        },
        syncTvl: syncTvl,
    };
}
