interface UserPoolData {
    poolId: string;
    poolAddress: string;
    shares: number;
    percentShare: number;
    value: number;
    tokens: UserTokenData[];
}

interface UserTokenData {
    address: string;
    symbol: string;
    name: string;
    price: number;
    balance: number;
    value: number;
}
