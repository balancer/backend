export interface YearnVault {
    inception: number;
    address: string;
    symbol: string;
    name: string;
    display_name: string;
    icon: string;
    token: YearnVaultToken;
    tvl: YearnVaultTvl;
    apy: YearnVaultApy;
    strategies: YearnStrategy[];
    endorsed: boolean;
    version: string;
    decimals: number;
    type: YearnVaultType;
    emergency_shutdown: boolean;
    updated: number;
    migration: YearnVaultMigration;
}

interface YearnVaultApy {
    type: YearnVaultApyType;
    gross_apr: number;
    net_apy: number;
    fees: YearnFees;
    points: YearnPoints;
    composite: null;
}

interface YearnFees {
    performance: number;
    withdrawal: number | null;
    management: number | null;
    keep_crv: null;
    cvx_keep_crv: null;
}

interface YearnPoints {
    week_ago: number;
    month_ago: number;
    inception: number;
}

type YearnVaultApyType = 'error' | 'v2:averaged';

interface YearnVaultMigration {
    available: boolean;
    address: string;
}

interface YearnStrategy {
    address: string;
    name: string;
}

interface YearnVaultToken {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    display_name: string;
    icon: string;
}

interface YearnVaultTvl {
    total_assets: number;
    price: number | null;
    tvl: number | null;
}

type YearnVaultType = 'v2';

export interface ReaperCrypt {
    _id: string;
    provider: ReaperProvider;
    cryptContent: ReaperCryptContent;
    analytics: ReaperCryptAnalytics;
    __v: number;
}

interface ReaperCryptAnalytics {
    assets: ReaperAsset[];
    tvl: number;
    yields: ReaperYields;
}

interface ReaperAsset {
    name: string;
    address: string;
    value: number;
}

interface ReaperYields {
    day: number;
    week: number;
    month: number;
    year: number;
}

interface ReaperCryptContent {
    pid: number;
    name: string;
    symbol: string;
    tokens: ReaperToken[];
    addresses: string[];
    fees: ReaperFees;
    exchange?: ReaperProvider;
    lpToken: ReaperAddress;
    vault: ReaperAddress;
    strategy: ReaperAddress;
}

type ReaperProvider = 'aave' | 'beethoven' | 'multistrat' | 'velodrome';

interface ReaperFees {
    depositFee: string;
    withdrawFee: string;
    interestFee: string;
}

interface ReaperAddress {
    address: string;
}
export interface ReaperToken {
    name: string;
    address: string;
}
