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
    fees: Fees;
    points: Points;
    composite: null;
}

interface Fees {
    performance: number;
    withdrawal: number | null;
    management: number | null;
    keep_crv: null;
    cvx_keep_crv: null;
}

interface Points {
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
