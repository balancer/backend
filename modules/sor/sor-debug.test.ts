import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { poolService } from '../pool/pool.service';
import { sorService } from './sor.service';
describe('sor debugging', () => {
    it('sor v2 arb eth->usdc', async () => {
        const chain = 'ARBITRUM';
        const tokenIn = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1';
        const tokenOut = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';

        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '42161');
        //only do once before starting to debug
        await poolService.syncAllPoolsFromSubgraph();
        await poolService.loadOnChainDataForAllPools();
        await poolService.updateLiquidityValuesForPools();

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn,
            tokenOut,
            swapType: 'EXACT_IN',
            swapAmount: '0.1',
            queryBatchSwap: true,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
        });

        console.log(swaps.returnAmount);
        expect(parseFloat(swaps.returnAmount)).toBeGreaterThan(0);
    }, 5000000);
});
