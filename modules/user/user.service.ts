import { Chain, PrismaPoolStaking, PrismaPoolStakingType } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { GqlPoolJoinExit, GqlPoolSwap } from '../../apps/api/gql/generated-schema';
import { tokenService } from '../token/token.service';
import { UserBalanceService } from './lib/user-balance.service';
import { UserSyncWalletBalanceService } from './lib/user-sync-wallet-balance.service';
import { UserPoolBalance, UserStakedBalanceService } from './user-types';
import { networkContext } from '../network/network-context.service';

export class UserService {
    constructor(
        private readonly userBalanceService: UserBalanceService,
        private readonly walletSyncService: UserSyncWalletBalanceService,
    ) {}

    private get stakedSyncServices(): UserStakedBalanceService[] {
        return networkContext.config.userStakedBalanceServices;
    }

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
        await Promise.all(this.stakedSyncServices.map((service) => service.initStakedBalances(stakingTypes, chain)));
    }

    public async syncChangedStakedBalances(chain: Chain) {
        await Promise.all(this.stakedSyncServices.map((service) => service.syncChangedStakedBalances(chain)));
    }
}

export const userService = new UserService(new UserBalanceService(), new UserSyncWalletBalanceService());
