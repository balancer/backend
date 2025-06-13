import type { Address } from 'viem';
import { SwapPathInput, SwapPathResult } from './generate/getSwapPath';

// Read from main test config file
export type Config = {
    swapPathTests: SwapPathTestConfig[];
};

export type TestBase = {
    chainId: number;
    blockNumber: bigint;
};

export type PoolBase = {
    poolType: string;
    poolAddress: Address;
    hook?: { address: string };
};

type SwapPathTestConfig = TestBase & {
    testName: string;
    swapPathInput: SwapPathInput;
};

export type SwapPathTestInput = SwapPathTestConfig & {
    rpcUrl: string;
};

export type SwapPathTestOutput = {
    swapPath: SwapPathResult;
    pools: PoolBase[];
    test: TestBase;
};

export type TransformBigintToString<T> = {
    [K in keyof T]: T[K] extends bigint ? string : T[K] extends bigint[] ? string[] : T[K];
};
