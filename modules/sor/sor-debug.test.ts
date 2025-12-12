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
        const chain = Chain.BASE;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        // only do once before starting to debug
        // bun task sor-sync-v2 {chainId}

        const swapType = 'EXACT_IN';
        const swapKind: SwapKind = SwapKind.GivenIn;

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0x4200000000000000000000000000000000000006', // wETH
            tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
            swapType,
            swapAmount: '0.009',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            poolIds: [
                        "0x2db50a0e0310723ef0c2a165cb9a9f80d772ba2f00020000000000000000000d",
                        "0x6fbfcf88db1aada31f34215b2a1df7fafb4883e900000000000000000000000c",
                        "0x8f360baf899845441eccdc46525e26bb8860752a0002000000000000000001cd"
                    ],
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

    it('sor v3', async () => {
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
            tokenIn: '0x0c4e186eae8acaa7f7de1315d5ad174be39ec987', // smsUSD
            tokenOut: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38', // USDC
            swapType,
            swapAmount: '1000000',
            useProtocolVersion,
            poolIds: ['0x944d4ae892de4bfd38742cc8295d6d5164c5593c'],
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
