import { PoolController } from '../../controllers/pool-controller';
describe('pool debugging', () => {
    it('reload pools', async () => {
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        // await poolService.syncChangedPools();
        await PoolController().reloadPoolsV3('11155111');
    }, 5000000);
});
