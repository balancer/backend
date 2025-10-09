import { BigintIsh, BaseToken } from '@balancer/sdk';
import { PoolTokenWithRate } from '../../utils';

export class WeightedPoolTokenWithRate extends PoolTokenWithRate {
    public readonly weight: bigint;

    public constructor(token: BaseToken, amount: BigintIsh, index: number, rate: bigint, weight: BigintIsh) {
        super(token, amount, index, rate);
        this.weight = BigInt(weight);
    }

    public copy(): WeightedPoolTokenWithRate {
        return new WeightedPoolTokenWithRate(this.token, this.amount, this.index, this.rate, this.weight);
    }
}
