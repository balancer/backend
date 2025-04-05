import type { Address } from 'viem';
import {
    SwapKind,
    Swap,
    type SwapInput as SdkSwapInput,
    type ExactInQueryOutput,
    type ExactOutQueryOutput,
} from '@balancer/sdk';

export type SwapPathInput = {
    swapKind: SwapKind;
    pools: {
        poolAddress: Address;
        poolType: string;
    }[];
    tokens: Address[];
    amountRaw: bigint;
};

export type SwapPathResult = Omit<SwapPathInput, 'amountRaw' | 'pools'> & {
    pools: Address[];
    amountRaw: string;
    outputRaw: string;
};

async function querySwapPath(
    chainId: number,
    rpcUrl: string,
    swapPathInput: SwapPathInput,
    blockNumber: bigint,
): Promise<bigint> {
    const swapInput: SdkSwapInput = {
        chainId: chainId,
        swapKind: swapPathInput.swapKind,
        paths: [
            {
                pools: swapPathInput.pools.map((pool) => pool.poolAddress),
                tokens: swapPathInput.tokens.map((token) => ({
                    address: token,
                    decimals: 18, // does not need decimals because uses raw amounts everywhere
                })),
                isBuffer: swapPathInput.pools.map((pool) => pool.poolType === 'Buffer'),
                protocolVersion: 3,
                inputAmountRaw: swapPathInput.swapKind === SwapKind.GivenIn ? BigInt(swapPathInput.amountRaw) : 0n,
                outputAmountRaw: swapPathInput.swapKind === SwapKind.GivenOut ? BigInt(swapPathInput.amountRaw) : 0n,
            },
        ],
    };
    const sdkSwap = new Swap(swapInput);
    let result = 0n;
    if (swapPathInput.swapKind === SwapKind.GivenIn) {
        const queryResult = (await sdkSwap.query(rpcUrl, blockNumber)) as ExactInQueryOutput;
        result = queryResult.expectedAmountOut.amount;
    } else {
        const queryResult = (await sdkSwap.query(rpcUrl, blockNumber)) as ExactOutQueryOutput;
        result = queryResult.expectedAmountIn.amount;
    }
    return result;
}

export async function getSwapPath(
    swapPathInput: SwapPathInput,
    rpcUrl: string,
    chainId: number,
    blockNumber: bigint,
): Promise<SwapPathResult> {
    console.log('Querying swap paths...');
    const result = await querySwapPath(chainId, rpcUrl, swapPathInput, blockNumber);

    console.log('Done');
    return {
        ...swapPathInput,
        pools: swapPathInput.pools.map((pool) => pool.poolAddress),
        amountRaw: swapPathInput.amountRaw.toString(),
        outputRaw: result.toString(),
    };
}
