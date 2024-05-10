import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { poolService } from '../pool/pool.service';
describe('pool debugging', () => {
    it('sync pools', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '250');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        await poolService.syncChangedPools();
    }, 5000000);
});
