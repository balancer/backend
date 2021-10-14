interface UserPoolData {
    id: string;
    poolId: string;
    poolAddress: string;
    shares: number;
    percentShare: number;
    totalPrice: number;
    pricePerShare: number;
    tokens: UserTokenData[];
}

interface UserTokenData {
    id: string;
    address: string;
    symbol: string;
    name: string;
    balance: number;
    pricePerToken: number;
    totalPrice: number;
}
