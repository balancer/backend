import WeightedPoolAbi from '../pool/abi/WeightedPool.json';
import { getContractAt, jsonRpcProvider } from '../util/ethers';
import _, { add } from 'lodash';
import { Multicaller } from '../util/multicaller';
import { networkConfig } from '../config/network-config';
import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import { Zero } from '@ethersproject/constants';
import { UserWalletBalanceService } from './src/user-wallet-balance.service';
import { UserMasterchefFarmBalanceService } from './src/user-masterchef-farm-balance.service';
import { UserStakedBalanceService } from './user-types';

export class UserService {
    constructor(
        private readonly walletBalanceService: UserWalletBalanceService,
        private readonly stakedBalanceService: UserStakedBalanceService,
    ) {}

    public async initWalletBalancesForAllPools() {
        await this.walletBalanceService.initBalancesForPools();
    }

    public async initWalletBalancesForPool(poolId: string) {
        await this.walletBalanceService.initBalancesForPool(poolId);
    }

    public async syncWalletBalancesForAllPools() {
        await this.walletBalanceService.syncBalancesForAllPools();
    }

    public async initStakedBalances() {
        await this.stakedBalanceService.initStakedBalances();
    }

    public async syncStakedBalances() {
        await this.stakedBalanceService.syncStakedBalances();
    }
}

export const userService = new UserService(new UserWalletBalanceService(), new UserMasterchefFarmBalanceService());
