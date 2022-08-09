import { AmountHumanReadable } from '../common/global-types';
import { PrismaPoolStaking } from '@prisma/client';

export interface UserStakedBalanceService {
    syncStakedBalances(): Promise<void>;
    initStakedBalances(): Promise<void>;
    syncUserBalance(input: UserSyncUserBalanceInput): Promise<void>;
}

export interface UserPoolBalance {
    poolId: string;
    tokenAddress: string;
    totalBalance: AmountHumanReadable;
    walletBalance: AmountHumanReadable;
    stakedBalance: AmountHumanReadable;
}

export interface UserSyncUserBalanceInput {
    userAddress: string;
    poolId: string;
    poolAddress: string;
    staking: PrismaPoolStaking;
}
