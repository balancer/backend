// bun vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { sorService } from './sor.service';

describe('sor debugging', () => {
    it('sor v2', async () => {
        const useProtocolVersion = 2;
        const chain = Chain.SONIC;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        // only do once before starting to debug
        // bun task sor-sync-v2 {chainId}

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xd3dce716f3ef535c5ff8d041c1a41c3bd89b97ae', // scUSD
            tokenOut: '0x3bce5cb273f0f148010bbea2470e7b5df84c7812', // sETH
            swapType: 'EXACT_OUT',
            swapAmount: '1',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            poolIds: ['0xe7734b495a552ab6f4c78406e672cca7175181e10002000000000000000000c5'],
        });

        console.log(swaps.returnAmount);
        for (const route of swaps.routes) {
            for (const hop of route.hops) {
                console.log(hop.pool.id);
            }
        }

        expect(parseFloat(swaps.returnAmount)).toBeGreaterThan(0);
    }, 5000000);

    it('sor v3', async () => {
        const useProtocolVersion = 3;
        const chain = Chain.SONIC;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // bun task sor-sync-v3 {chainId}

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xfa85fe5a8f5560e9039c04f2b0a90de1415abd70', // wanS
            tokenOut: '0x871a101dcf22fe4fe37be7b654098c801cba1c88', // beS
            swapType: 'EXACT_IN',
            swapAmount: '10',
            useProtocolVersion,
            // poolIds: ['0x5cd1ab566d0f03c6aab84b96f6076a276390c0bd'],
        });

        console.log(swaps.returnAmount);
        for (const route of swaps.routes) {
            for (const hop of route.hops) {
                console.log(hop.pool.address);
            }
        }
        expect(parseFloat(swaps.returnAmount)).toBeGreaterThan(0);
    }, 5000000);
});
