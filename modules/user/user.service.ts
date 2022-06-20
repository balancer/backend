import WeightedPoolAbi from '../pool/abi/WeightedPool.json';
import { getContractAt, jsonRpcProvider } from '../util/ethers';
import _, { add } from 'lodash';
import { Multicaller } from '../util/multicaller';
import { networkConfig } from '../config/network-config';
import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import { Zero } from '@ethersproject/constants';
import { UserWalletBalanceService } from './src/user-wallet-balance.service';

export class UserService {
    constructor(private readonly walletBalanceService: UserWalletBalanceService) {}

    public async initWalletBalancesForAllPools() {
        await this.walletBalanceService.initBalancesForAllPools();
    }

    public async initWalletBalancesForMissingPools() {
        await this.walletBalanceService.initBalancesForMissingPools();
    }

    public async initWalletBalancesForPool(poolId: string) {
        await this.walletBalanceService.initBalancesForPool(poolId);
    }

    public async syncWalletBalancesForAllPools() {
        await this.walletBalanceService.syncBalancesForAllPools();
    }
}

export const userService = new UserService(new UserWalletBalanceService());
