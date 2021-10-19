export interface UserPortfolioData {
    timestamp: number;
    totalValue: number;
    totalSwapFees: number;
    totalSwapVolume: number;
    myFees: number;

    pools: UserPoolData[];
    tokens: UserTokenData[];
}

export interface UserPoolData {
    id: string;
    poolId: string;
    poolAddress: string;
    name: string;
    shares: number;
    percentShare: number;
    totalValue: number;
    pricePerShare: number;
    tokens: UserTokenData[];
    swapFees: number;
    swapVolume: number;
    myFees: number;
    percentOfPortfolio: number;
    priceChange: number;
    priceChangePercent: number;
}

export interface UserTokenData {
    id: string;
    address: string;
    symbol: string;
    name: string;
    balance: number;
    pricePerToken: number;
    totalValue: number;
    percentOfPortfolio: number;
}
