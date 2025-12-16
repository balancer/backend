import { Chain } from '@prisma/client';
import { Hex } from 'viem';

export type YieldToken = {
    address: string;
    chain: Chain;
    source: string;
    /** Defined as float, eg: 0.01 is 1% */
    apr: number;
};

export type TokenApr = {
    /** Defined as float, eg: 0.01 is 1% */
    apr: number;
    address: string;
};

export type TokenYieldHandler = (config?: any) => Promise<TokenApr[]>;

type EntryExtractor =
    | { readonly type: 'path'; readonly token: string; readonly path: string }
    | { readonly type: 'enumerate'; readonly path: string; readonly entries: (item: any) => [string, number] };

export interface RateProviderYieldConfig {
    chain: Chain;
    intervalInDays: number;
    rateProviders: {
        tokenAddress: string;
        rateProviderAddress: string;
    }[];
}

export interface TokenYieldHttpFetchConfig {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    scale?: number;
    average?: boolean;
    skipSSL?: boolean;
    extractors: readonly EntryExtractor[];
}

export interface TokenYieldContractFetchConfig {
    name?: string; // for devs to know what token is this
    chain: Chain;
    contract: string;
    token: string;
    abi: string;
    functionName: string;
    args?: string[];
    parser: (result: any) => number;
}

export interface AaveAddressBookEntry {
    UI_POOL_DATA_PROVIDER: Hex;
    POOL_ADDRESSES_PROVIDER: Hex;
    ASSETS?: Record<
        string,
        {
            UNDERLYING: string;
            STATIC_A_TOKEN?: string;
            STATA_TOKEN?: string;
        }
    >;
    CHAIN_ID: number;
}

export interface TokenYieldConfig {
    aave?: {
        markets: AaveAddressBookEntry[];
    };
    sts?: {
        token: string;
    };
    loops?: {
        token: string;
    };
    euler?: {
        url: string;
        lens: string;
        chain: Chain;
    };
    http?: TokenYieldHttpFetchConfig[];
    contract?: {
        calls: TokenYieldContractFetchConfig[];
    };
    hypurrfi?: {
        markets: string[];
    };
    morphoVaultHyperevm?: {
        vaults: string[];
    };
    rateProvider?: RateProviderYieldConfig;
}
