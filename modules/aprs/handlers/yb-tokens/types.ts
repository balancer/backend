import { Chain } from '@prisma/client';

export type TokenApr = {
    /** Defined as float, eg: 0.01 is 1% */
    apr: number;
    address: string;
};

export type YbAprHandler = (config?: any) => Promise<TokenApr[]>;

export interface FixedAprConfig {
    [tokenName: string]: {
        address: string;
        apr: number;
    };
}

type EntryExtractor =
    | { readonly type: 'path'; readonly token: string; readonly path: string }
    | { readonly type: 'enumerate'; readonly path: string; readonly entries: (item: any) => [string, number] };

export interface AprHttpFetchConfig {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    scale?: number;
    average?: boolean;
    extractors: readonly EntryExtractor[];
}

export interface YbAprConfig {
    aave?: {
        market: string;
        subgraphUrl: string;
        tokens: Record<
            string,
            {
                underlyingAssetAddress: string;
                aTokenAddress: string;
                wrappedTokens: Record<string, string>;
            }
        >;
    }[];
    sts?: {
        token: string;
    };
    silo?: {
        markets: string[];
    };
    euler?: {
        url: string;
        lens: string;
        chain: Chain;
    };
    http?: AprHttpFetchConfig[];
    maker?: {
        sdai: string;
    };
    maple?: {
        url: string;
        token: string;
    };
    dforce?: {
        token: string;
    };
    fixedAprHandler?: FixedAprConfig;
    hypurrfi?: {
        markets: string[];
    };
    morphoVaultHyperevm?: {
        vaults: string[];
    };
}
