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

// for portfolio
export interface UserPortfolioSnapshot {
    timestamp: number;
    walletBalance: AmountHumanReadable;
    gaugeBalance: AmountHumanReadable;
    farmBalance: AmountHumanReadable;
    totalBalance: AmountHumanReadable;
    totalValueUSD: AmountHumanReadable;
    fees24h: AmountHumanReadable;
    totalFees: AmountHumanReadable;
    pools: UserPoolSnapshot[];

    // totalSwapFees: number;
    // totalSwapVolume: number;
    // tokens: UserTokenData[];
}

export interface UserPoolSnapshot {
    // id: string;
    timestamp: number;
    // poolId: string;
    // poolAddress: string;
    // poolName: string;
    walletBalance: AmountHumanReadable;
    gaugeBalance: AmountHumanReadable;
    farmBalance: AmountHumanReadable;
    totalBalance: AmountHumanReadable;
    percentShare: number;
    totalValueUSD: AmountHumanReadable;
    fees24h: AmountHumanReadable;
    // totalFees: string;
    // percentOfPortfolio: number;
    // priceChange24h: number;
    // priceChangePercent24h: number;

    // shares: number;
    // pricePerShare: number;
    // tokens: UserTokenData[];
    // swapFees: number;
    // swapVolume: number;
}

// export interface UserTokenData {
//     id: string;
//     address: string;
//     symbol: string;
//     name: string;
//     balance: number;
//     pricePerToken: number;
//     totalValue: number;
//     percentOfPortfolio: number;
// }
