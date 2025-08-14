// bun vitest sor-debug.test.ts
import { Chain } from '@prisma/client';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { sorService } from './sor.service';
import { Address, Swap, SwapInput, SwapKind } from '@balancer/sdk';
import { formatUnits } from 'viem';

describe('sor debugging', () => {
    it('sor v2', async () => {
        const useProtocolVersion = 2;
        const chain = Chain.SONIC;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        // only do once before starting to debug
        // bun task sor-sync-v2 {chainId}

        const swapType = 'EXACT_OUT';
        const swapKind: SwapKind = SwapKind.GivenOut;

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38', // wS
            tokenOut: '0xe5da20f15420ad15de0fa650600afc998bbe3955', // stS
            swapType,
            swapAmount: '100000',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            // poolIds: ['0x40d2cbc586dd8df50001cdba3f65cd4bbc32d596000200000000000000000154'],
        });

        console.log('protocol version', swaps.protocolVersion);
        console.log('return amount', swaps.returnAmount);
        for (const route of swaps.routes) {
            for (const hop of route.hops) {
                console.log(hop.poolId);
            }
        }

        const swapInput: SwapInput = {
            chainId: Number(chainId),
            paths: swaps.paths.map((path) => {
                return {
                    pools: path.pools as Address[],
                    tokens: path.tokens.map((token) => ({
                        address: token.address as Address,
                        decimals: token.decimals,
                    })),
                    outputAmountRaw: BigInt(path.outputAmountRaw),
                    inputAmountRaw: BigInt(path.inputAmountRaw),
                    protocolVersion: swaps.protocolVersion as 2 | 1 | 3,
                    isBuffer: path.isBuffer,
                };
            }),
            swapKind,
        };
        const sdkSwap = new Swap(swapInput);
        const queryResult = await sdkSwap.query();
        const queryResultAmount =
            queryResult.swapKind === SwapKind.GivenIn ? queryResult.expectedAmountOut : queryResult.expectedAmountIn;

        const queryResultFloat = parseFloat(formatUnits(queryResultAmount.amount, queryResultAmount.token.decimals));
        const sorResultFloat = parseFloat(swaps.returnAmount);
        const ratio = queryResultFloat / sorResultFloat;

        expect(ratio).toBeCloseTo(1, 3);
    }, 5000000);

    it.only('sor v3', async () => {
        const useProtocolVersion = 3;
        const chain = Chain.SONIC;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // bun task sor-sync-v3 {chainId}

        const swapType = 'EXACT_IN';
        const swapKind: SwapKind = SwapKind.GivenIn;

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0x29219dd400f2bf60e5a23d13be72b486d4038894', // ETH
            tokenOut: '0xeeeeeee6d95e55a468d32feb5d6648754d10a967', // LINK
            swapType,
            swapAmount: '1',
            useProtocolVersion,
            poolIds: ['0x5103ea917605463fc497396ba89d6732ce4b2d70'],
        });

        swaps.paths.forEach((path, i) => {
            console.log(`path ${i}`, path.pools);
        });
        console.log('SOR result:   ', swaps.returnAmount);

        // Perform sanity check against on-chain query

        const swapInput: SwapInput = {
            chainId: Number(chainId),
            paths: swaps.paths.map((path) => {
                return {
                    pools: path.pools as Address[],
                    tokens: path.tokens.map((token) => ({
                        address: token.address as Address,
                        decimals: token.decimals,
                    })),
                    outputAmountRaw: BigInt(path.outputAmountRaw),
                    inputAmountRaw: BigInt(path.inputAmountRaw),
                    protocolVersion: useProtocolVersion,
                    isBuffer: path.isBuffer,
                };
            }),
            swapKind,
        };
        const sdkSwap = new Swap(swapInput);
        const queryResult = await sdkSwap.query();
        const queryResultAmount =
            queryResult.swapKind === SwapKind.GivenIn ? queryResult.expectedAmountOut : queryResult.expectedAmountIn;
        console.log('Query result: ', formatUnits(queryResultAmount.amount, queryResultAmount.token.decimals));

        const queryResultFloat = parseFloat(formatUnits(queryResultAmount.amount, queryResultAmount.token.decimals));
        const sorResultFloat = parseFloat(swaps.returnAmount);

        const ratio = queryResultFloat / sorResultFloat;

        expect(ratio).toBeCloseTo(1, 3);
    }, 5000000);
});
