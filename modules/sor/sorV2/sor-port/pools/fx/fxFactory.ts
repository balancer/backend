import { BasePool, BasePoolFactory } from '..';
import { FxPool } from './fxPool';
import { RawFxPool, RawPool } from '../../../data/types';

export class FxPoolFactory implements BasePoolFactory {
    public isPoolForFactory(pool: RawPool): boolean {
        return pool.poolType.includes('FX');
    }

    public create(chainId: number, pool: RawPool): BasePool {
        return FxPool.fromRawPool(chainId, pool as RawFxPool);
    }
}
