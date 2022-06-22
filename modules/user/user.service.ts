import { UserSyncWalletBalanceService } from './src/user-sync-wallet-balance.service';
import { UserSyncMasterchefFarmBalanceService } from './src/user-sync-masterchef-farm-balance.service';
import { UserPoolBalance, UserStakedBalanceService } from './user-types';
import { prisma } from '../util/prisma-client';
import _ from 'lodash';
import { UserBalanceService } from './src/user-balance.service';

export class UserService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
        private readonly walletSyncService: UserSyncWalletBalanceService,
        private readonly stakedSyncService: UserStakedBalanceService,
    ) {}

    public async getUserPoolBalances(address: string): Promise<UserPoolBalance[]> {
        return this.userBalanceService.getUserPoolBalances(address);
    }

    public async getUserFbeetsBalance(address: string): Promise<Omit<UserPoolBalance, 'poolId'>> {
        return this.userBalanceService.getUserFbeetsBalance(address);
    }

    public async initWalletBalancesForAllPools() {
        await this.walletSyncService.initBalancesForPools();
    }

    public async initWalletBalancesForPool(poolId: string) {
        await this.walletSyncService.initBalancesForPool(poolId);
    }

    public async syncWalletBalancesForAllPools() {
        await this.walletSyncService.syncBalancesForAllPools();
    }

    public async initStakedBalances() {
        await this.stakedSyncService.initStakedBalances();
    }

    public async syncStakedBalances() {
        await this.stakedSyncService.syncStakedBalances();
    }
}

export const userService = new UserService(
    new UserBalanceService(),
    new UserSyncWalletBalanceService(),
    new UserSyncMasterchefFarmBalanceService(),
);
