import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { CowAmmController } from '../controllers/cow-amm-controller';
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

    it('sync wallet balances', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '1');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        // const reliquaryUserService = new UserSyncReliquaryFarmBalanceService(networkContext.s.reliquary!.address);
        // await poolService.syncStakingForPools(['AVALANCHE']);
        // await CowAmmController().reloadPools('1');
        await userService.syncChangedWalletBalancesForAllPools();
    }, 5000000);
});
