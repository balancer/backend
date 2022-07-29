import { UserStakedBalanceService } from '../../user-types';

export class UserSyncGaugeBalanceService implements UserStakedBalanceService {
    public async initStakedBalances(): Promise<void> {}

    public async syncStakedBalances(): Promise<void> {}
}
