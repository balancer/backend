import { Address, Hex } from 'viem';
import { GqlPoolType, GqlSorGetSwapsResponse, GqlSorSwapType } from '../../../../schema';
import { replaceZeroAddressWithEth } from '../../../web3/addresses';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { Token } from './token';
import { BigintIsh, TokenAmount } from './tokenAmount';

export interface BasePool {
    readonly poolType: GqlPoolType;
    readonly id: Hex;
    readonly address: string;
    swapFee: bigint;
    tokens: TokenAmount[];
    getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint;
    swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint;
}

export type SwapInputRawAmount = BigintIsh;

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
    poolId: Hex;
    kind: SwapKind;
    assetIn: Address;
    assetOut: Address;
    amount: bigint;
    userData: Hex;
}

export interface BatchSwapStep {
    poolId: Hex;
    assetInIndex: bigint;
    assetOutIndex: bigint;
    amount: bigint;
    userData: Hex;
}

export type InputToken = {
    address: Address;
    decimals: number;
};

export type InputAmount = InputToken & {
    rawAmount: bigint;
};

export type InputAmountInit = InputAmount | InputAmountInitWeighted;

export type InputAmountInitWeighted = InputAmount & {
    weight: bigint;
};

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
