import { BigintIsh, Token } from '@balancer/sdk';
import { PoolTokenWithRate } from '../../utils';

export class WeightedPoolTokenWithRate extends PoolTokenWithRate {
    public readonly weight: bigint;

    public constructor(token: Token, amount: BigintIsh, index: number, rate: bigint, weight: BigintIsh) {
        super(token, amount, index, rate);
        this.weight = BigInt(weight);
    }
}
