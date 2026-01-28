import { AmountHumanReadable } from '../common/global-types';
import { Chain, PrismaPoolStakingType } from '@prisma/client';

export interface UserStakedBalanceService {
    syncChangedStakedBalances(chain: Chain): Promise<void>;
    initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void>;
}

export interface UserPoolBalance {
    poolId: string;
    tokenAddress: string;
    totalBalance: AmountHumanReadable;
    walletBalance: AmountHumanReadable;
    stakedBalance: AmountHumanReadable;
    chain: Chain;
}

export interface UserRelicSnapshot {
    timestamp: number;
    totalBalance: string;
    relicCount: number;
    relicSnapshots: RelicSnapshot[];
}

export interface RelicSnapshot {
    relicId: number;
    farmId: string;
    balance: string;
    entryTimestamp: number;
    level: number;
}
