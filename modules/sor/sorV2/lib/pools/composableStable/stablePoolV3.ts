import { SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { ComposableStablePool } from './composableStablePool';
import { Stable, StableState, Vault } from '@balancer-labs/balancer-maths';
import { WAD } from '../../utils/math';
import { BasePoolV3 } from '../basePool';

export class StablePoolV3 extends ComposableStablePool implements BasePoolV3 {
    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const poolState = this.getPoolState();
        const stableV3 = new Stable(poolState);
        return stableV3.getMaxSwapAmount({
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

    getPoolState(): StableState {
        return {
            poolType: 'Stable',
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => t.rate),
            totalSupply: this.totalShares,
            amp: this.amp,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar * WAD), // double check this math
        };
    }
}
