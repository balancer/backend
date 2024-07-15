import { SwapKind, Token, TokenAmount, WAD } from '@balancer/sdk';
import { WeightedPool } from './weightedPool';
import { Vault, Weighted, WeightedState } from '@balancer-labs/balancer-maths';
import { BasePoolV3 } from '../basePool';

export class WeightedPoolV3 extends WeightedPool implements BasePoolV3 {
    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const poolState = this.getPoolState();
        const weightedV3 = new Weighted(poolState);
        return weightedV3.getMaxSwapAmount({
            ...poolState,
            swapKind,
            indexIn: this.tokens.findIndex((t) => t.token.isEqual(tokenIn)),
            indexOut: this.tokens.findIndex((t) => t.token.isEqual(tokenOut)),
        });
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const vault = new Vault();
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                swapKind: SwapKind.GivenIn,
            },
            this.getPoolState(),
        );
        return TokenAmount.fromRawAmount(tokenOut, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const vault = new Vault();
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                swapKind: SwapKind.GivenOut,
            },
            this.getPoolState(),
        );
        return TokenAmount.fromRawAmount(tokenIn, calculatedAmount);
    }

    getPoolState(): WeightedState {
        return {
            poolType: 'Weighted',
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((_) => WAD), // TODO: double check this, but I think weighetd pool always have rates = 1
            totalSupply: this.totalShares,
            weights: this.tokens.map((t) => t.weight),
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar * WAD), // double check this math
        };
    }
}
