import { BigintIsh, DECIMAL_SCALES, MathSol, Token, TokenAmount, WAD } from '@balancer/sdk';
import { BasePoolToken } from './basePoolToken';

export class PoolTokenWithRate extends BasePoolToken {
    public readonly rate: bigint;

    public constructor(token: Token, amount: BigintIsh, index: number, rate: BigintIsh) {
        super(token, amount, index);
        this.rate = BigInt(rate);
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        return this;
    }

    static fromScale18Amount(): TokenAmount {
        throw new Error('Use fromScale18AmountWithRate instead');
    }

    static fromScale18AmountWithRate(
        token: Token,
        scale18: bigint,
        rate: bigint,
        index: number,
        divUp: boolean = true,
    ): TokenAmount {
        const scalar =
            DECIMAL_SCALES[
                (18 - token.decimals) as 0 | 1 | 2 | 3 | 4 | 5 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
            ];
        const scaledRate = rate * scalar;
        const amount = divUp ? MathSol.divUpFixed(scale18, scaledRate) : MathSol.divDownFixed(scale18, scaledRate);
        return new PoolTokenWithRate(token, amount, index, rate);
    }
}
