import type { Address } from 'viem';
import {
    SwapKind,
    Swap,
    type SwapInput as SdkSwapInput,
    type ExactInQueryOutput,
    type ExactOutQueryOutput,
} from '@balancer/sdk';
import { TransformBigintToString } from '../types';

export type Path = {
    pools: {
        poolAddress: Address;
        poolType: string;
    }[];
    tokens: Address[];
    amountRaw: bigint;
    calculatedAmountRaw: bigint;
};

export type SwapPathInput = {
    swapKind: SwapKind;
    paths: Path[];
};

export type SwapPathResult = Omit<SwapPathInput, 'paths'> & {
    paths: TransformBigintToString<Path>[];
};

async function querySwapPath(
    chainId: number,
    rpcUrl: string,
    swapPathInput: SwapPathInput,
    blockNumber: bigint,
): Promise<bigint[]> {
    const swapInput: SdkSwapInput = {
        chainId: chainId,
        swapKind: swapPathInput.swapKind,
        paths: swapPathInput.paths.map((path) => ({
            pools: path.pools.map((pool) => pool.poolAddress),
            tokens: path.tokens.map((token) => ({
                address: token,
                decimals: 18, // does not need decimals because uses raw amounts everywhere
            })),
            isBuffer: path.pools.map((pool) => pool.poolType === 'Buffer'),
            protocolVersion: 3,
            inputAmountRaw: swapPathInput.swapKind === SwapKind.GivenIn ? path.amountRaw : 0n,
            outputAmountRaw: swapPathInput.swapKind === SwapKind.GivenOut ? path.amountRaw : 0n,
        })),
    };
    const sdkSwap = new Swap(swapInput);
    let result = [];
    if (swapPathInput.swapKind === SwapKind.GivenIn) {
        const queryResult = (await sdkSwap.query(rpcUrl, blockNumber)) as ExactInQueryOutput;
        result = queryResult.pathAmounts ? [...queryResult.pathAmounts] : [queryResult.expectedAmountOut.amount];
    } else {
        const queryResult = (await sdkSwap.query(rpcUrl, blockNumber)) as ExactOutQueryOutput;
        result = queryResult.pathAmounts ? [...queryResult.pathAmounts] : [queryResult.expectedAmountIn.amount];
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

    if (result.length !== swapPathInput.paths.length) {
        throw new Error(
            `Result length ${result.length} does not match swapPath.paths length ${swapPathInput.paths.length}`,
        );
    }

    console.log('Done');
    return {
        ...swapPathInput,
        paths: swapPathInput.paths.map((path, index) => ({
            ...path,
            amountRaw: path.amountRaw.toString(),
            calculatedAmountRaw: result[index].toString(),
        })),
    };
}
