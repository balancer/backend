import { AmountHumanReadable } from '../common/global-types';

export interface UserStakedBalanceService {
    syncStakedBalances(): Promise<void>;
    initStakedBalances(): Promise<void>;
}

export interface UserPoolBalance {
    poolId: string;
    tokenAddress: string;
    totalBalance: AmountHumanReadable;
    walletBalance: AmountHumanReadable;
    stakedBalance: AmountHumanReadable;
}
