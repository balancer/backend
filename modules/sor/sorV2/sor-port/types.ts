import { GqlPoolType, GqlSorGetSwapsResponse, GqlSorSwapType } from '../../../../schema';
import { replaceZeroAddressWithEth } from '../../../web3/addresses';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';

export interface BasePool {
    readonly poolType: GqlPoolType;
    readonly id: string;
    readonly address: string;
    swapFee: bigint;
    tokens: TokenAmount[];
    getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint;
    swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint;
}

export enum SwapKind {
    GivenIn = 0,
    GivenOut = 1,
}

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

export interface SingleSwap {
    poolId: string;
    kind: SwapKind;
    assetIn: string;
    assetOut: string;
    amount: bigint;
    userData: string;
}

export interface BatchSwapStep {
    poolId: string;
    assetInIndex: bigint;
    assetOutIndex: bigint;
    amount: bigint;
    userData: string;
}

export function zeroResponse(
    swapType: GqlSorSwapType,
    tokenIn: string,
    tokenOut: string,
    swapAmount: string,
): GqlSorGetSwapsResponse {
    return {
        marketSp: '0',
        tokenAddresses: [],
        swaps: [],
        tokenIn: replaceZeroAddressWithEth(tokenIn),
        tokenOut: replaceZeroAddressWithEth(tokenOut),
        swapType,
        tokenInAmount: swapType === 'EXACT_IN' ? swapAmount : '0',
        tokenOutAmount: swapType === 'EXACT_IN' ? '0' : swapAmount,
        swapAmount: swapType === 'EXACT_IN' ? '0' : swapAmount,
        swapAmountScaled: '0',
        swapAmountForSwaps: '0',
        returnAmount: '0',
        returnAmountScaled: '0',
        returnAmountConsideringFees: '0',
        returnAmountFromSwaps: '0',
        routes: [],
        effectivePrice: '0',
        effectivePriceReversed: '0',
        priceImpact: '0',
    };
}

export const DECIMAL_SCALES: Record<number, bigint> = {
    0: 1n,
    1: 10n,
    2: 100n,
    3: 1000n,
    4: 10000n,
    5: 100000n,
    6: 1000000n,
    7: 10000000n,
    8: 100000000n,
    9: 1000000000n,
    10: 10000000000n,
    11: 100000000000n,
    12: 1000000000000n,
    13: 10000000000000n,
    14: 100000000000000n,
    15: 1000000000000000n,
    16: 10000000000000000n,
    17: 100000000000000000n,
    18: 1000000000000000000n,
};

export const ZERO_ADDRESS: string = '0x0000000000000000000000000000000000000000';
export const NATIVE_ADDRESS: string = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const DEFAULT_FUND_MANAGMENT = {
    sender: ZERO_ADDRESS,
    recipient: ZERO_ADDRESS,
    fromInternalBalance: false,
    toInternalBalance: false,
};

export const DEFAULT_USERDATA = '0x';
