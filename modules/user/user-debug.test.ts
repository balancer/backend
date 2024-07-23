import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { poolService } from '../pool/pool.service';
import { userService } from './user.service';

describe('user debugging', () => {
    it('sync reliquary balances', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '43114');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        // const reliquaryUserService = new UserSyncReliquaryFarmBalanceService(networkContext.s.reliquary!.address);
        // await poolService.syncStakingForPools(['AVALANCHE']);
        await userService.syncChangedStakedBalances();
    }, 5000000);

    it('sync user balances', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '100');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        // const reliquaryUserService = new UserSyncReliquaryFarmBalanceService(networkContext.s.reliquary!.address);
        // await poolService.syncStakingForPools(['GNOSIS']);
        await userService.syncChangedStakedBalances();
    }, 5000000);
});
