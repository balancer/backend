import { PoolType, SwapKind, BaseToken, TokenAmount } from '@balancer/sdk';
import { Hex } from 'viem';

import { BasePoolToken } from '../utils/basePoolToken';

export interface BasePool {
    readonly poolType: PoolType | string;
    readonly id: Hex;
    readonly address: string;
    swapFee: bigint;
    tokens: BasePoolToken[];
    getNormalizedLiquidity(tokenIn: BaseToken, tokenOut: BaseToken): bigint;
    swapGivenIn(tokenIn: BaseToken, tokenOut: BaseToken, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    swapGivenOut(tokenIn: BaseToken, tokenOut: BaseToken, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount;
    getLimitAmountSwap(tokenIn: BaseToken, tokenOut: BaseToken, swapKind: SwapKind): bigint;
    /**
     * Validate that pool contains tokenIn and tokenOut provided and returns pool specific token data (e.g. balance, index, weight, rate, etc.)
     */
    getPoolTokens(tokenIn: BaseToken, tokenOut: BaseToken): { tIn: BasePoolToken; tOut: BasePoolToken };
    copy(): BasePool;
}
