import { BigintIsh, Token, TokenAmount, WAD } from '@balancer/sdk';
import { BasePoolToken } from '../../poolsV2/basePoolToken';

export class StableBasePoolToken extends BasePoolToken {
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
}
