import { Token } from '@balancer/sdk';
import { BasePool } from '../poolsV2/basePool';

export interface PoolTokenPair {
    id: string;
    pool: BasePool;
    tokenIn: Token;
    tokenOut: Token;
}

export type PoolAddressDictionary = {
    [address: string]: BasePool;
};

export type PoolPairMap = {
    [tokenInTokenOut: string]: {
        poolPair: PoolTokenPair;
        normalizedLiquidity: bigint;
    }[];
};

export interface PathGraphTraversalConfig {
    maxDepth: number;
    maxDepthFallback: number;
    maxQueue: number;
    maxTokenPaths: number;
    maxBuffersInPath: number;
    maxCandidatesPerTokenPath: number;
    minSwapAmountRatio: number;
    poolIdsToInclude?: string[];
}

export interface PathSegment {
    pool: BasePool;
    normalizedLiquidity: bigint;
    tokenIn: Token;
    tokenOut: Token;
    isBuffer: boolean;
    limitUSD?: number;
}
