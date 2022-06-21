export interface UserStakedBalanceService {
    syncStakedBalances(): Promise<void>;
    initStakedBalances(): Promise<void>;
}
