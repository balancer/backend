import { BigintIsh, Token, TokenAmount } from '@balancer/sdk';

export class WeightedPoolToken extends TokenAmount {
    public readonly weight: bigint;
    public readonly index: number;

    public constructor(token: Token, amount: BigintIsh, weight: BigintIsh, index: number) {
        super(token, amount);
        this.weight = BigInt(weight);
        this.index = index;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.scale18 = this.amount * this.scalar;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.scale18 = this.amount * this.scalar;
        return this;
    }
}
