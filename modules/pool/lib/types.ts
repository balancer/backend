import { Chain, PrismaPoolType } from '@prisma/client';
import { BigNumber } from 'ethers';

export interface PoolInput {
    id: string;
    address: string;
    chain: Chain;
    type: PrismaPoolType | 'COMPOSABLE_STABLE';
    typeData: any;
    version: number;
    tokens: {
        id: string;
        index: number;
        address: string;
        token: {
            decimals: number;
        };
        dynamicData: {
            balance: string;
            balanceUSD: number;
            priceRate?: string | null;
            weight?: string | null;
        } | null;
    }[];
    dynamicData: {
        totalShares: string;
        totalLiquidity: number;
        swapEnabled: boolean;
        swapFee: string;
        protocolYieldFee?: string | null;
        protocolSwapFee?: string | null;
    } | null;
}

export interface PoolTokenPairsOutput {
    [poolId: string]: {
        tokenPairs: TokenPairData[];
    };
}

export type TokenPairData = {
    tokenA: string;
    tokenB: string;
    normalizedLiquidity: string;
    spotPrice: string;
};

export interface TokenPair {
    poolId: string;
    poolTvl: number;
    valid: boolean;
    tokenA: Token;
    tokenB: Token;
    normalizedLiqudity: bigint;
    spotPrice: bigint;
    aToBAmountIn: bigint;
    aToBAmountOut: bigint;
    bToAAmountOut: bigint;
    effectivePrice: bigint;
    effectivePriceAmountIn: bigint;
}

export interface Token {
    address: string;
    decimals: number;
    balance: string;
    balanceUsd: number;
}

export interface AToBOnchainData {
    effectivePriceAmountOut: BigNumber;
    aToBAmountOut: BigNumber;
}
export interface BToAOnchainData {
    bToAAmountOut: BigNumber;
}

export interface RawOnchainData {
    poolTokens: [string[], BigNumber[]];
    totalSupply: BigNumber;
    swapFee: BigNumber;
    swapEnabled?: boolean;
    protocolYieldFeePercentageCache?: BigNumber;
    protocolSwapFeePercentageCache?: BigNumber;
    rate?: BigNumber;
    weights?: BigNumber[];
    targets?: [BigNumber, BigNumber];
    wrappedTokenRate?: BigNumber;
    amp?: [BigNumber, boolean, BigNumber];
    tokenRates?: [BigNumber, BigNumber];
    tokenRate?: BigNumber[];
    metaPriceRateCache?: [BigNumber, BigNumber, BigNumber][];
}

export interface ParsedOnchainData {
    amp?: string;
    swapFee: string;
    totalShares: string;
    weights?: string[];
    targets?: string[];
    poolTokens: {
        tokens: string[];
        balances: string[];
        rates: (string | undefined)[];
    };
    wrappedTokenRate?: string;
    rate?: string;
    swapEnabled?: boolean;
    protocolYieldFeePercentageCache?: string;
    protocolSwapFeePercentageCache?: string;
}
