import { Chain, PrismaPoolStaking, PrismaPoolStakingType } from '@prisma/client';
import { UserBalanceService } from './lib/user-balance.service';
import { UserSyncWalletBalanceService } from './lib/user-sync-wallet-balance.service';
import { UserPoolBalance } from './user-types';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

export class UserService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
        private readonly walletSyncService: UserSyncWalletBalanceService,
    ) {}

    public async getUserPoolBalances(address: string, chains: Chain[]): Promise<UserPoolBalance[]> {
        return this.userBalanceService.getUserPoolBalances(address, chains);
    }

    public async getUserFbeetsBalance(address: string): Promise<Omit<UserPoolBalance, 'poolId'>> {
        return this.userBalanceService.getUserFbeetsBalance(address);
    }

    public async getUserStaking(address: string, chains: Chain[]): Promise<PrismaPoolStaking[]> {
        return this.userBalanceService.getUserStaking(address, chains);
    }

    public async initWalletBalancesForPool(poolId: string) {
        await this.walletSyncService.initBalancesForPool(poolId);
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain) {
        await Promise.all(
            AllNetworkConfigsKeyedOnChain[chain].userStakedBalanceServices.map((service) =>
                service.initStakedBalances(stakingTypes, chain),
            ),
        );
    }

    public async syncChangedStakedBalances(chain: Chain) {
        await Promise.all(
            AllNetworkConfigsKeyedOnChain[chain].userStakedBalanceServices.map((service) =>
                service.syncChangedStakedBalances(chain),
            ),
        );
    }
}

export const userService = new UserService(new UserBalanceService(), new UserSyncWalletBalanceService());
