import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { userService } from './user.service';

describe('user debugging', () => {
    it('sync reliquary balances', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '250');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        // const reliquaryUserService = new UserSyncReliquaryFarmBalanceService(networkContext.s.reliquary!.address);
        await userService.syncChangedStakedBalances();
    }, 5000000);
});
