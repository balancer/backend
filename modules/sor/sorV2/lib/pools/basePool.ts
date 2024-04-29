import { PoolType, RemoveLiquidityKind, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { Hex } from 'viem';

export interface BasePool {
    readonly poolType: PoolType | string;
    readonly id: Hex;
    readonly address: string;
    swapFee: bigint;
    tokens: TokenAmount[];
    getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint;
    swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    addLiquiditySingleTokenExactIn(
        tokenIn: Token,
        bpt: Token,
        amount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount;
    addLiquiditySingleTokenExactOut(tokenIn: Token, amount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    removeLiquiditySingleTokenExactIn(tokenOut: Token, amount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    removeLiquiditySingleTokenExactOut(
        tokenOut: Token,
        bpt: Token,
        amount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount;
    getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint;
    getLimitAmountRemoveLiquidity(bpt: Token, tokenOut: Token, removeLiquidityKind: RemoveLiquidityKind): bigint;
}
