import { BigintIsh, Token } from '@balancer/sdk';
import { BasePoolToken } from '../../utils/basePoolToken';

export class WeightedBasePoolToken extends BasePoolToken {
    public readonly weight: bigint;

    public constructor(token: Token, amount: BigintIsh, index: number, weight: BigintIsh) {
        super(token, amount, index);
        this.weight = BigInt(weight);
    }
}
