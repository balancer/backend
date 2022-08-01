import { PoolStakingService } from '../../../pool-types';

export class GaugeStakingService implements PoolStakingService {
    public async reloadStakingForAllPools(): Promise<void> {}

    public async syncStakingForPools(): Promise<void> {}
}
