import { BufferState } from '@balancer-labs/balancer-maths';
import { PoolState } from '@balancer-labs/balancer-maths';
import { BasePool } from '../poolsV2/basePool';
import { BasePoolToken, Erc4626PoolToken } from '../utils';

export interface BasePoolMethodsV3 extends BasePool {
    tokens: (BasePoolToken | Erc4626PoolToken)[];
    getPoolState(): PoolState | BufferState;
}
