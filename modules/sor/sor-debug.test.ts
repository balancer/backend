// yarn vitest sor-debug.test.ts
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
        const chain = Chain.SEPOLIA;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // bun task sor-sync-v3 {chainId}

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xb19382073c7a0addbb56ac6af1808fa49e377b75', // BAL
            tokenOut: '0xb77eb1a70a96fdaaeb31db1b42f2b8b5846b2613', // DAI
            swapType: 'EXACT_IN',
            swapAmount: '0.01',
            useProtocolVersion,
            poolIds: ['0x9c781a9dcd12110f92b8eb1af21d441d58f5e8da'], // gyroECLP
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
