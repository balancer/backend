import { Chain } from '@prisma/client';
import { GqlCowSwapApiResponse, GqlSorSwapType, GqlSorGetSwapsResponse, GqlSorSwapOptionsInput } from '../../schema';
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

export interface GraphTraversalConfig {
    approxPathsToReturn?: number;
    maxDepth?: number;
    maxNonBoostedHopTokensInBoostedPath?: number;
    maxNonBoostedPathDepth?: number;
}

export interface SwapResult {
    getCowSwapResponse(chain: Chain, queryFirst: boolean): Promise<GqlCowSwapApiResponse>;
    getBeetsSwapResponse(queryFirst: boolean): Promise<GqlSorGetSwapsResponse>;
    isValid: boolean;
    outputAmount: bigint;
    inputAmount: bigint;
}

export interface SwapService {
    getSwapResult(inputs: GetSwapsInput): Promise<SwapResult>;
}
