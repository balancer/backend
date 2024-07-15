// yarn vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { poolService } from '../pool/pool.service';
import { sorService } from './sor.service';
import { chainIdToChain } from '../network/chain-id-to-chain';

describe('sor debugging', () => {
    it('sor v2 arb eth->usdc', async () => {
        const chain = Chain.SEPOLIA;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        //only do once before starting to debug
        await poolService.syncAllPoolsFromSubgraph();
        await poolService.loadOnChainDataForAllPools();
        await poolService.updateLiquidityValuesForPools();

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xb19382073c7A0aDdbb56Ac6AF1808Fa49e377B75', // BAL
            tokenOut: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9', // WETH
            swapType: 'EXACT_IN',
            swapAmount: '1',
            queryBatchSwap: false,
            useProtocolVersion: 3,
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
