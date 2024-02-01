import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';

export interface SwapOptions {
    block?: bigint;
    slippage?: bigint;
    funds?: FundManagement;
    deadline?: bigint;
    graphTraversalConfig?: Partial<PathGraphTraversalConfig>;
}

export interface FundManagement {
    sender: string;
    fromInternalBalance: boolean;
    recipient: string;
    toInternalBalance: boolean;
}
