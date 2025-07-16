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
        const chain = Chain.MAINNET;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        // only do once before starting to debug
        // bun task sor-sync-v2 {chainId}

        const swapType = 'EXACT_IN';
        const swapKind: SwapKind = SwapKind.GivenIn;

        /* const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
            tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // USDC
            swapType,
            swapAmount: '100',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            poolIds: [
                '0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7',
                '0x63fc054159094583a27632361bd11c94c30e48c70002000000000000000006f7',
            ],
        }); */

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
            tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            swapType,
            swapAmount: '100',
            useProtocolVersion,
            // callDataInput: {
            //     receiver: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     sender: '0xb5e6b895734409Df411a052195eb4EE7e40d8696',
            //     slippagePercentage: '0.1',
            // },
            // poolIds: [
            //     '0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7',
            //     '0x63fc054159094583a27632361bd11c94c30e48c70002000000000000000006f7',
            // ],
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
        const chain = Chain.BASE;

        const chainId = Object.keys(chainIdToChain).find((key) => chainIdToChain[key] === chain) as string;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        // only do once before starting to debug
        // bun task sor-sync-v3 {chainId}

        const swapType = 'EXACT_OUT';
        const swapKind: SwapKind = SwapKind.GivenOut;

        const swaps = await sorService.getSorSwapPaths({
            chain,
            tokenIn: '0x4200000000000000000000000000000000000006', // WETH
            tokenOut: '0xc694a91e6b071bf030a18bd3053a7fe09b6dae69', // COW
            swapType,
            swapAmount: '5',
            useProtocolVersion,
            poolIds: ['0xff028c1ec4559d3aa2b0859aa582925b5cc28069'],
        });

        console.log(swaps.returnAmount);
        swaps.paths.forEach((path, i) => {
            console.log(`path ${i}`, path.pools);
        });

        // Perform sanity check agaist on-chain query

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

        const queryResultFloat = parseFloat(formatUnits(queryResultAmount.amount, queryResultAmount.token.decimals));
        const sorResultFloat = parseFloat(swaps.returnAmount);

        const ratio = queryResultFloat / sorResultFloat;

        expect(ratio).toBeCloseTo(1, 3);
    }, 5000000);
});
