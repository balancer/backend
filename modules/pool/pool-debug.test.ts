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

    it('get types in pooltokens', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '42161');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        const pool = await poolService.getGqlPool(
            '0x2ce4457acac29da4736ae6f5cd9f583a6b335c270000000000000000000004dc',
            'ARBITRUM',
        );
        expect(pool.poolTokens[0].isAllowed).toBeDefined();
        expect(pool.poolTokens[0].isAllowed).toBeTruthy();

        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '10');
        const poolOp = await poolService.getGqlPool(
            '0xd4156a7a7e85d8cb2de2932807d8d5f08d05a88900020000000000000000011c',
            'OPTIMISM',
        );
        expect(poolOp.poolTokens[0].isAllowed).toBeDefined();
        expect(poolOp.poolTokens[0].isAllowed).toBeTruthy();
        expect(poolOp.poolTokens[1].isAllowed).toBeDefined();
        expect(poolOp.poolTokens[1].isAllowed).toBeFalsy();

        const poolOpBpt = await poolService.getGqlPool(
            '0x5f8893506ddc4c271837187d14a9c87964a074dc000000000000000000000106',
            'OPTIMISM',
        );
        expect(poolOpBpt.poolTokens[0].isAllowed).toBeDefined();
        expect(poolOpBpt.poolTokens[0].isAllowed).toBeTruthy();
        expect(poolOpBpt.poolTokens[1].isAllowed).toBeDefined();
        expect(poolOpBpt.poolTokens[1].isAllowed).toBeTruthy();
        expect(poolOpBpt.poolTokens[2].isAllowed).toBeDefined();
        expect(poolOpBpt.poolTokens[2].isAllowed).toBeTruthy();
        expect(poolOpBpt.poolTokens[3].isAllowed).toBeDefined();
        expect(poolOpBpt.poolTokens[3].isAllowed).toBeTruthy();
    }, 5000000);

    it('sync aura staking', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '1');
        //only do once before starting to debug
        // await poolService.syncAllPoolsFromSubgraph();
        // await poolService.loadOnChainDataForAllPools();
        await poolService.reloadStakingForAllPools(['AURA'], 'MAINNET');
        const pool = await poolService.getGqlPool(
            '0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274',
            'MAINNET',
        );
        expect(pool.staking).toBeDefined();
        expect(pool.staking?.aura).toBeDefined();
        expect(pool.staking?.aura?.apr).toBeGreaterThan(0);
        expect(pool.staking?.aura?.auraPoolAddress).toBe('0x1204f5060be8b716f5a62b4df4ce32acd01a69f5');
    }, 5000000);
});
