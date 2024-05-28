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

    it('sync aprs', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '137');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        await poolService.updatePoolAprs('POLYGON');
    }, 5000000);

    it('get new apr items', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '42161');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        await poolService.updatePoolAprs('ARBITRUM');
        const pool = await poolService.getGqlPool(
            '0x2ce4457acac29da4736ae6f5cd9f583a6b335c270000000000000000000004dc',
            'ARBITRUM',
        );
        expect(pool.dynamicData.aprItems).toBeDefined();
        expect(pool.dynamicData.aprItems.length).toBeGreaterThan(0);
    }, 5000000);
});
