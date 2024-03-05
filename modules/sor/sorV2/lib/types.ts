import { TokenAmount, SwapKind, Token } from '@balancer/sdk';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { BasePool } from './pools/basePool';

export interface FundManagement {
    sender: string;
    fromInternalBalance: boolean;
    recipient: string;
    toInternalBalance: boolean;
}

export interface SorSwapOptions {
    block?: bigint;
    slippage?: bigint;
    funds?: FundManagement;
    deadline?: bigint;
    graphTraversalConfig?: Partial<PathGraphTraversalConfig>;
}
