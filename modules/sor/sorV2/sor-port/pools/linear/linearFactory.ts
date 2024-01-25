import { BasePool, BasePoolFactory } from '../index';
import { LinearPool } from './linearPool';
import { RawLinearPool, RawPool } from '../../../data/types';

export class LinearPoolFactory implements BasePoolFactory {
    public isPoolForFactory(pool: RawPool): boolean {
        return pool.poolType.includes('Linear');
    }

    public create(chainId: number, pool: RawPool): BasePool {
        return LinearPool.fromRawPool(chainId, pool as RawLinearPool);
    }
}
