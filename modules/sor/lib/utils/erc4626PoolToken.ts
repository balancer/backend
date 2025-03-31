import { BigintIsh, Token } from '@balancer/sdk';
import { PoolTokenWithRate } from './poolTokenWithRate';

export class Erc4626PoolToken extends PoolTokenWithRate {
    public readonly unwrapRate: bigint;
    public readonly underlyingTokenAddress: string;

    public constructor(
        token: Token,
        amount: BigintIsh,
        index: number,
        rate: bigint,
        unwrapRate: bigint,
        underlyingTokenAddress: string,
    ) {
        super(token, amount, index, rate);
        this.unwrapRate = unwrapRate;
        this.underlyingTokenAddress = underlyingTokenAddress;
    }
}
