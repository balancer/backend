export interface IbAprConfig {
    aave?: AaveAprConfig;
    ankr?: AnkrAprConfig;
    bloom?: BloomAprConfig;
    beefy?: BeefyAprConfig;
    euler?: EulerAprConfig;
    gearbox?: GearBoxAprConfig;
    idle?: IdleAprConfig;
    maker?: MakerAprConfig;
    ovix?: OvixAprConfig;
    reaper?: ReaperAprConfig;
    tessera?: TesseraAprConfig;
    tetu?: TetuAprConfig;
    tranchess?: TranchessAprConfig;
    yearn?: YearnAprConfig;
    defaultHandlers?: DefaultHandlerAprConfig;
    fixedAprHandler?: FixedAprConfig;
}

export interface AaveAprConfig {
    [version: string]: {
        subgraphUrl: string;
        tokens: {
            [underlyingAssetName: string]: {
                underlyingAssetAddress: string;
                aTokenAddress: string;
                wrappedTokens: {
                    [wrappedTokenName: string]: string;
                };
                isIbYield?: boolean;
            };
        };
    };
}

export interface AnkrAprConfig {
    sourceUrl: string;
    tokens: {
        [underlyingAssetName: string]: {
            address: string;
            serviceName: string;
            isIbYield?: boolean;
        };
    };
}

export interface BeefyAprConfig {
    sourceUrl: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            // To get the vaultId, get the vault address from the token contract(token.vault()),
            // and search for the vault address in the link: https://api.beefy.finance/vaults
            vaultId: string;
            isIbYield?: boolean;
        };
    };
}

export interface BloomAprConfig {
    tokens: {
        [tokenName: string]: {
            address: string;
            feedAddress: string;
            isIbYield?: boolean;
        };
    };
}

export interface EulerAprConfig {
    subgraphUrl: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            isIbYield?: boolean;
        };
    };
}

export interface GearBoxAprConfig {
    sourceUrl: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            isIbYield?: boolean;
        };
    };
}

export interface IdleAprConfig {
    sourceUrl: string;
    authorizationHeader: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            wrapped4626Address: string;
            isIbYield?: boolean;
        };
    };
}

export interface MakerAprConfig {
    tokens: {
        [tokenName: string]: {
            address: string;
            potAddress: string;
            isIbYield?: boolean;
        };
    };
}

export interface OvixAprConfig {
    tokens: {
        [tokenName: string]: {
            yieldAddress: string;
            wrappedAddress: string;
            isIbYield?: boolean;
        };
    };
}

export interface ReaperAprConfig {
    subgraphSource?: {
        subgraphUrl: string;
        tokens: {
            [tokenName: string]: {
                address: string;
                isSftmX?: boolean;
                isWstETH?: boolean;
                isIbYield?: boolean;
            };
        };
    };
    onchainSource?: {
        averageAPRAcrossLastNHarvests: number;
        tokens: {
            [tokenName: string]: {
                address: string;
                isSftmX?: boolean;
                isWstETH?: boolean;
                isIbYield?: boolean;
            };
        };
    };
}

export interface TesseraAprConfig {
    tokens: {
        [tokenName: string]: {
            tesseraPoolAddress: string;
            tokenAddress: string;
            isIbYield?: boolean;
        };
    };
}

export interface TetuAprConfig {
    sourceUrl: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            isIbYield?: boolean;
        };
    };
}

export interface TranchessAprConfig {
    sourceUrl: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            underlyingAssetName: string;
            isIbYield?: boolean;
        };
    };
}

export interface YearnAprConfig {
    sourceUrl: string;
    isIbYield?: boolean;
}

export interface DefaultHandlerAprConfig {
    [tokenName: string]: {
        sourceUrl: string;
        tokenAddress: string;
        path?: string;
        scale?: number;
        group?: string;
        isIbYield?: boolean;
    };
}

export interface FixedAprConfig {
    [tokenName: string]: {
        address: string;
        apr: number;
        group?: string;
        isIbYield?: boolean;
    };
}
