import { BigNumber } from 'ethers';
import moment from 'moment-timezone';
import { env } from '../../app/env';
import { beetsBarService } from '../beets-bar-subgraph/beets-bar.service';
import { beetsService } from '../beets/beets.service';
import { getContractAt } from '../ethers/ethers';
import { tokenPriceService } from '../token-price/token-price.service';
import { decimal, fp, fromFp } from '../util/numbers';
import erc20ContractAbi from './abi/ERC20.json';
import lockingContractAbi from './abi/FBeetsLocker.json';
import { QueryLockersArgs } from './generated/locking-subgraph-types';
import { lockingSubgraph } from './locking-subgraph';
import { FBeetsLocker } from './types/FBeetsLocker';

export type Locker = {
    totalLockedPercentage: string;
    totalLockedAmount: string;
    totalLockedUsd: string;
    timestamp: string;
    block: string;
};

export type LockingReward = {
    amount: string;
    amountUsd: string;
    token: string;
};

export type LockingPeriod = {
    epoch: string;
    lockAmount: string;
    lockAmountUsd: string;
    withdrawn: boolean;
};

export type LockingUser = {
    id: string;
    address: string;
    claimedRewards: LockingReward[];
    collectedKickRewardAmount: string;
    collectedKickRewardAmountUsd: string;
    lockingPeriods: LockingPeriod[];
    totalClaimedRewardsUsd: string;
    totalLockedAmount: string;
    totalLockedAmountUsd: string;
    totalUnlockedAmount: string;
    totalUnlockedAmountUsd: string;
    totalLostThroughKick: string;
    totalLostThroughKickUsd: string;
    totalVotingPower: string;
    lockedToVotingPowerRatio: string;
    timestamp: string;
    block: string;
};

export type LockingRewardToken = {
    rewardPeriodFinish: string;
    rewardRate: string;
    rewardToken: string;
    totalRewardAmount: string;
    totalRewardAmountUsd: string;
    apr: string;
};

const SECONDS_PER_YEAR = 31557600;

class LockingService {
    private lockingContract: FBeetsLocker = getContractAt(env.LOCKING_CONTRACT_ADDRESS, lockingContractAbi);

    public async getLocker(args: QueryLockersArgs): Promise<Locker> {
        const locker = await lockingSubgraph.getLocker(args);

        const fBeetsPrice = await beetsService.getFBeetsPrice();
        const totalLockedAmount = decimal(locker.totalLockedAmount);
        const totalLockedUsd = totalLockedAmount.mul(fBeetsPrice);

        const beetsBar = await beetsBarService.getBeetsBarNow();
        const totalLockedPercentage = totalLockedAmount.div(decimal(beetsBar.totalSupply)).toFixed();
        console.log(
            `total supply ${beetsBar.totalSupply}, total locked ${locker.totalLockedAmount}, percentage ${totalLockedPercentage}`,
        );

        return {
            ...locker,
            totalLockedPercentage,
            totalLockedUsd: totalLockedUsd.toFixed(),
        };
    }
    public async getUser(accountAddress: string): Promise<LockingUser> {
        const { user } = await lockingSubgraph.getUser({ id: accountAddress });
        if (!user) {
            throw new Error(`User with account ${accountAddress} not found`);
        }
        const fBeetsPrice = await beetsService.getFBeetsPrice();

        const latestTokenPrices = await tokenPriceService.getTokenPrices();

        const claimedRewards: LockingReward[] = [];
        let totalClaimedRewardsUsd = decimal(0);
        for (let reward of user.claimedRewards) {
            const { token, amount } = reward;
            const tokenPrice = tokenPriceService.getPriceForToken(latestTokenPrices, token);
            const usdValue = decimal(amount).mul(tokenPrice);
            claimedRewards.push({
                token,
                amount,
                amountUsd: usdValue.toFixed(),
            });
            totalClaimedRewardsUsd = totalClaimedRewardsUsd.add(usdValue);
        }

        const lockingPeriods: LockingPeriod[] = [];
        let totalUnlockAmount = decimal(0);
        let totalUnlockAmountUsd = decimal(0);

        const userBalance = await this.lockingContract.balances(user.address);
        const lastProcessedUserLock = await this.lockingContract.userLocks(
            user.address,
            userBalance.nextUnlockIndex.toNumber() - 1,
        );
        const lastProcessedEpoch = lastProcessedUserLock.unlockTime.toNumber() - env.LOCKING_DURATION;

        for (let lockingPeriod of user.lockingPeriods) {
            const usdValue = decimal(lockingPeriod.lockAmount).mul(fBeetsPrice);
            const withdrawn = Number(lockingPeriod.epoch) <= lastProcessedEpoch;
            lockingPeriods.push({
                epoch: lockingPeriod.epoch,
                lockAmount: lockingPeriod.lockAmount,
                lockAmountUsd: usdValue.toFixed(),
                withdrawn,
            });
            if (
                !withdrawn &&
                moment.unix(parseInt(lockingPeriod.epoch) + env.LOCKING_DURATION).isBefore(moment.now())
            ) {
                totalUnlockAmount = totalUnlockAmount.add(lockingPeriod.lockAmount);
                totalUnlockAmountUsd = totalUnlockAmountUsd.add(usdValue);
            }
        }

        const totalVotingPower = await this.getVotingPower(accountAddress);

        return {
            ...user,
            totalLockedAmountUsd: decimal(user.totalLockedAmount).mul(fBeetsPrice).toFixed(),
            totalUnlockedAmount: totalUnlockAmount.toFixed(),
            totalUnlockedAmountUsd: totalUnlockAmountUsd.toFixed(),
            totalLostThroughKickUsd: decimal(user.totalLostThroughKick).mul(fBeetsPrice).toFixed(),
            totalClaimedRewardsUsd: totalClaimedRewardsUsd.toFixed(),
            collectedKickRewardAmountUsd: decimal(user.collectedKickRewardAmount).mul(fBeetsPrice).toFixed(),
            lockingPeriods,
            claimedRewards,
            totalVotingPower,
            lockedToVotingPowerRatio: decimal(totalVotingPower).div(decimal(user.totalLockedAmount)).toFixed(),
        };
    }

    public async getRewardTokens(): Promise<LockingRewardToken[]> {
        const locker = await this.getLocker({});
        const { rewardTokens } = await lockingSubgraph.getRewardTokens({});

        const latestTokenPrices = await tokenPriceService.getTokenPrices();

        const rewards: LockingRewardToken[] = [];
        for (let reward of rewardTokens) {
            const { rewardPeriodFinish, rewardRate, rewardToken, totalRewardAmount } = reward;
            const tokenPrice = tokenPriceService.getPriceForToken(latestTokenPrices, rewardToken);
            const totalRewardAmountUsd = decimal(totalRewardAmount).mul(tokenPrice).toFixed();
            const apr = decimal(rewardRate)
                .mul(SECONDS_PER_YEAR)
                .mul(tokenPrice)
                .div(decimal(locker.totalLockedUsd))
                .toFixed();

            rewards.push({
                rewardToken,
                rewardRate,
                rewardPeriodFinish,
                totalRewardAmount,
                totalRewardAmountUsd,
                apr,
            });
        }
        return rewards;
    }

    public async getPendingRewards(accountAddress: string): Promise<LockingReward[]> {
        const claimableRewards: { amount: BigNumber; token: string }[] = await this.lockingContract.claimableRewards(
            accountAddress,
        );

        const latestTokenPrices = await tokenPriceService.getTokenPrices();
        const rewards: LockingReward[] = [];
        for (let reward of claimableRewards) {
            const erc20Contract = getContractAt(reward.token, erc20ContractAbi);
            const decimals: BigNumber = await erc20Contract.decimals();

            const amount = decimal(reward.amount).div(decimal(`1e${decimals}`));
            const tokenPrice = tokenPriceService.getPriceForToken(latestTokenPrices, reward.token);
            const amountUsd = amount.mul(tokenPrice).toFixed();

            rewards.push({
                token: reward.token,
                amount: amount.toFixed(),
                amountUsd,
            });
        }
        return rewards;
    }
    public async getVotingPower(accountAddress: string): Promise<string> {
        return fromFp(await this.lockingContract.balanceOf(accountAddress)).toFixed();
    }
}

export const lockingService = new LockingService();
