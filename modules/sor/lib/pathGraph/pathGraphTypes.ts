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

export interface PathGraphEdgeLabel {
    poolId: string;
    poolAddress: string;
    normalizedLiquidity: bigint;
    poolPair: PoolTokenPair;
    isPhantomBptHop: boolean;
}

export interface PathGraphEdge extends PathGraphEdgeLabel {
    tokenIn: string;
    tokenOut: string;
}

export interface PathGraphTraversalConfig {
    maxDepth: number;
    maxTokenPaths: number;
    maxBuffersInPath: number;
    approxPathsToReturn: number;
    minSwapAmountRatio: number;
    maxRanksPerSegment: number;
    poolIdsToInclude?: string[];
}

export interface PathGraphEdgeData {
    pool: BasePool;
    normalizedLiquidity: bigint;
    tokenIn: Token;
    tokenOut: Token;
    isBuffer: boolean;
    // Optional USD-denominated optimistic limit for this edge for the active swapKind
    // Defined only in beam graph when prices are available
    limitUSD?: number;
}
