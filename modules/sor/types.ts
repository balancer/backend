import { Chain } from '@prisma/client';
import { GqlSorSwapType, GqlSwapCallDataInput } from '../../apps/api/gql/generated-schema';
import { TokenAmount } from '@balancer/sdk';

export interface GetSwapPathsInput {
    chain: Chain;
    tokenIn: string;
    tokenOut: string;
    swapType: GqlSorSwapType;
    swapAmount: TokenAmount;
    queryBatchSwap: boolean;
    protocolVersion: number;
    considerPoolsWithHooks: boolean;
    poolIds?: string[];
    callDataInput?: (GqlSwapCallDataInput & { wethIsEth: boolean }) | undefined;
}

export interface GraphTraversalConfig {
    approxPathsToReturn?: number;
    maxDepth?: number;
    maxNonBoostedHopTokensInBoostedPath?: number;
    maxNonBoostedPathDepth?: number;
}

export interface LiquidityManagement {
    disableUnbalancedLiquidity: boolean;
    enableAddLiquidityCustom: boolean;
    enableDonation: boolean;
    enableRemoveLiquidityCustom: boolean;
}
