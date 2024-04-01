import { Chain } from '@prisma/client';
import { GqlSorSwapType, GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSwapCallDataInput } from '../../schema';
import { TokenAmount } from '@balancer/sdk';
export interface GetSwapsInput {
    chain: Chain;
    tokenIn: string;
    tokenOut: string;
    swapType: GqlSorSwapType;
    swapAmount: TokenAmount;
    swapOptions: GqlSorSwapOptionsInput;
    graphTraversalConfig?: GraphTraversalConfig;
}

export interface GetSwapsV2Input {
    chain: Chain;
    tokenIn: string;
    tokenOut: string;
    swapType: GqlSorSwapType;
    swapAmount: TokenAmount;
    queryBatchSwap: boolean;
    vaultVersion: number,
    graphTraversalConfig?: GraphTraversalConfig;
    callDataInput?: (GqlSwapCallDataInput & { wethIsEth: boolean }) | undefined;
}

export interface GraphTraversalConfig {
    approxPathsToReturn?: number;
    maxDepth?: number;
    maxNonBoostedHopTokensInBoostedPath?: number;
    maxNonBoostedPathDepth?: number;
}

export interface SwapResult {
    getSorSwapResponse(queryFirst: boolean): Promise<GqlSorGetSwapsResponse>;
    isValid: boolean;
    outputAmount: bigint;
    inputAmount: bigint;
}

export interface SwapService {
    getSwapResult(inputs: GetSwapsInput): Promise<SwapResult>;
}

export enum PathOperation {
    Swap = 0,
    AddLiquidity = 1,
    RemoveLiquidity = 2,
}
