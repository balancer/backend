// bun vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { sorService } from './sor.service';

describe('sor debugging', () => {
    it('sor v2', async () => {
        const useProtocolVersion = 2;
        const chain = Chain.GNOSIS;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        // only do once before starting to debug
        // bun task sor-sync-v2 {chainId}

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xaf204776c7245bf4147c2612bf6e5972ee483701', // sDAI
            tokenOut: '0xe0ed85f76d9c552478929fab44693e03f0899f23', // s-KPK
            swapType: 'EXACT_IN',
            swapAmount: '10',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            poolIds: ['0x40d2cbc586dd8df50001cdba3f65cd4bbc32d596000200000000000000000154'],
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
        const chain = Chain.BASE;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // bun task sor-sync-v3 {chainId}

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
            tokenOut: '0x4200000000000000000000000000000000000006', // WETH
            swapType: 'EXACT_IN',
            swapAmount: '1',
            useProtocolVersion,
            poolIds: ['0x035d7213cbc08483aa78ced076dbdc8ac5a509c1'],
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
