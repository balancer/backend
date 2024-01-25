import { GyroEPool } from './gyroEPool';
import { BasePool, BasePoolFactory } from '../index';
import { RawGyroEPool, RawPool } from '../../../data/types';

export class GyroEPoolFactory implements BasePoolFactory {
    public isPoolForFactory(pool: RawPool): boolean {
        return pool.poolType.includes('GyroE');
    }

    public create(chainId: number, pool: RawPool): BasePool {
        return GyroEPool.fromRawPool(chainId, pool as RawGyroEPool);
    }
}
