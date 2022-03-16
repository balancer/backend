import { beetsService } from '../beets/beets.service';
import { tokenPriceService } from '../token-price/token-price.service';
import { QueryLockersArgs } from './generated/locking-subgraph-types';
import { lockingSubgraph } from './locking-subgraph';
import { getContractAt } from '../ethers/ethers';
import { env } from '../../app/env';
import lockingContractAbi from './abi/FBeetsLocker.json';

export type Locker = {
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
    totalLostThroughKick: string;
    totalLostThroughKickUsd: string;
    totalUnlockedAmount: string;
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
    private lockingContract = getContractAt(env.LOCKING_CONTRACT_ADDRESS, lockingContractAbi);

    public async getLocker(args: QueryLockersArgs): Promise<Locker> {
        const locker = await lockingSubgraph.getLocker(args);
        const fBeetsPrice = await beetsService.getFBeetsPrice();
        const totalLockedUsd = parseFloat(locker.totalLockedAmount) * fBeetsPrice;
        return {
            ...locker,
            totalLockedUsd: totalLockedUsd.toString(),
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
        for (let reward of user.claimedRewards) {
            const { token, amount } = reward;
            const tokenPrice = tokenPriceService.getPriceForToken(latestTokenPrices, token);
            claimedRewards.push({
                token,
                amount,
                amountUsd: (parseFloat(amount) * tokenPrice).toString(),
            });
        }

        return {
            ...user,
            totalUnlockedAmount: '',
            totalLostThroughKickUsd: '',
            totalClaimedRewardsUsd: '',
            collectedKickRewardAmountUsd: '',
            lockingPeriods: user.lockingPeriods.map((period) => ({
                epoch: period.epoch,
                lockAmount: period.lockAmount,
                lockAmountUsd: (parseFloat(period.lockAmount) * fBeetsPrice).toString(),
            })),
            claimedRewards,
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
            const totalRewardAmountUsd = (parseFloat(totalRewardAmount) * tokenPrice).toString();
            const apr = (
                (parseFloat(rewardRate) * SECONDS_PER_YEAR * tokenPrice) /
                parseFloat(locker.totalLockedUsd)
            ).toString();

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
        const claimableRewards: { amount: string; token: string }[] = await this.lockingContract.claimableRewards(
            accountAddress,
        );

        const latestTokenPrices = await tokenPriceService.getTokenPrices();
        const rewards: LockingReward[] = [];
        for (let reward of claimableRewards) {
            const tokenPrice = tokenPriceService.getPriceForToken(latestTokenPrices, reward.token);
            const amountUsd = (parseFloat(reward.amount) * tokenPrice).toString();
            rewards.push({
                token: reward.token,
                amount: reward.amount,
                amountUsd,
            });
        }
        return rewards;
    }
    public async getVotingPower(accountAddress: string): Promise<string> {
        return this.lockingContract.balanceOf(accountAddress);
    }
}

export const lockingService = new LockingService();
