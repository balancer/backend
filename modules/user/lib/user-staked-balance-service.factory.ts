import { Chain } from '@prisma/client';
import config from '../../../config';
import { UserStakedBalanceService } from '../user-types';
import { UserSyncGaugeBalanceService } from './user-sync-gauge-balance.service';
import { UserSyncVebalLockBalanceService } from './user-sync-vebal-lock-balance.service';
import { UserSyncReliquaryFarmBalanceService } from './user-sync-reliquary-farm-balance.service';

export function createUserStakedBalanceServices(chain: Chain): UserStakedBalanceService[] {
    const networkData = config[chain];
    return networkData.stakingServices.map((type) => {
        switch (type) {
            case 'gauge':
                return new UserSyncGaugeBalanceService();
            case 'vebal':
                return new UserSyncVebalLockBalanceService();
            case 'reliquary':
                if (!networkData.reliquary?.address) {
                    throw new Error(
                        `Chain ${chain} declares reliquary staking but has no reliquary address in config`,
                    );
                }
                return new UserSyncReliquaryFarmBalanceService(networkData.reliquary.address);
        }
    });
}
