import { Hex } from 'viem';

import { MAX_UINT256, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { AddKind, RemoveKind, Vault, HookState, PoolState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { TokenPairData } from '../../../sources/contracts/v3/fetch-tokenpair-data';

import { LiquidityManagement } from '../../types';
import { BasePoolToken } from '../utils';

export class BasePoolV3 {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public declare readonly poolType: PoolType | string;
    public readonly swapFee: bigint;
    public readonly aggregateSwapFee: bigint;
    public readonly tokenPairs: TokenPairData[];

    public totalShares: bigint;

    public declare tokens: BasePoolToken[];

    public readonly hookState: HookState | undefined;
    public readonly liquidityManagement: LiquidityManagement;

    protected vault: Vault;
    protected declare poolState: PoolState;

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        swapFee: bigint,
        aggregateSwapFee: bigint,
        totalShares: bigint,
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        this.chain = chain;
        this.id = id;
        this.address = address;
        this.swapFee = swapFee;
        this.aggregateSwapFee = aggregateSwapFee;
        this.totalShares = totalShares;

        this.tokenPairs = tokenPairs;
        this.hookState = hookState;
        this.liquidityManagement = liquidityManagement;

        this.vault = new Vault();
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        // remove liquidity
        if (tIn.token.isSameAddress(this.id)) {
            return this.vault.getMaxSingleTokenRemoveAmount(
                {
                    isExactIn: swapKind === SwapKind.GivenIn,
                    totalSupply: this.poolState.totalSupply,
                    tokenOutBalance: this.poolState.balancesLiveScaled18[tOut.index],
                    tokenOutScalingFactor: this.poolState.scalingFactors[tOut.index],
                    tokenOutRate: this.poolState.tokenRates[tOut.index],
                },
                this.poolState,
            );
        }
        // add liquidity
        if (tOut.token.isSameAddress(this.id)) {
            return this.vault.getMaxSingleTokenAddAmount(this.poolState);
        }
        // swap
        return this.vault.getMaxSwapAmount(
            {
                swapKind,
                balancesLiveScaled18: this.poolState.balancesLiveScaled18,
                tokenRates: this.poolState.tokenRates,
                scalingFactors: this.poolState.scalingFactors,
                indexIn: tIn.index,
                indexOut: tOut.index,
            },
            this.poolState,
        );
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // remove liquidity
            const { amountsOutRaw } = this.vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: this.poolState.tokens.map((_, i) => (i === tOut.index ? 1n : 0n)),
                    maxBptAmountInRaw: swapAmount.amount,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_IN,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = amountsOutRaw[tOut.index];
        } else if (tOut.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // add liquidity
            const { bptAmountOutRaw } = this.vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: this.poolState.tokens.map((_, i) => (i === tIn.index ? swapAmount.amount : 0n)),
                    minBptAmountOutRaw: 0n,
                    kind: AddKind.UNBALANCED,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = bptAmountOutRaw;
        } else {
            // swap
            calculatedAmount = this.vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenIn,
                },
                this.poolState,
                this.hookState,
            );
        }
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // remove liquidity
            const { bptAmountInRaw } = this.vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: this.poolState.tokens.map((_, i) => (i === tOut.index ? swapAmount.amount : 0n)),
                    maxBptAmountInRaw: MAX_UINT256,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_OUT,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = bptAmountInRaw;
        } else if (tOut.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // add liquidity
            const { amountsInRaw } = this.vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: this.poolState.tokens.map((_, i) => (i === tIn.index ? MAX_UINT256 : 0n)),
                    minBptAmountOutRaw: swapAmount.amount,
                    kind: AddKind.SINGLE_TOKEN_EXACT_OUT,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = amountsInRaw[tIn.index];
        } else {
            // swap
            calculatedAmount = this.vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenOut,
                },
                this.poolState,
                this.hookState,
            );
        }
        return TokenAmount.fromRawAmount(tIn.token, calculatedAmount);
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        const tokenPair = this.tokenPairs.find(
            (tokenPair) =>
                (tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address) ||
                (tokenPair.tokenA === tOut.token.address && tokenPair.tokenB === tIn.token.address),
        );

        if (tokenPair) {
            return BigInt(tokenPair.normalizedLiquidity);
        }
        return 0n;
    }

    public getPoolState(hookName?: string): PoolState {
        throw new Error('Must be implemented by the subclass');
    }

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: BasePoolToken; tOut: BasePoolToken } {
        throw new Error('Must be implemented by the subclass');
    }
}
