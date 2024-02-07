import { formatEther, formatUnits } from 'ethers/lib/utils';
import { Multicaller3 } from '../../web3/multicaller3';
import { PrismaPoolType } from '@prisma/client';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import ElementPoolAbi from '../abi/ConvergentCurvePool.json';
import LinearPoolAbi from '../abi/LinearPool.json';
import LiquidityBootstrappingPoolAbi from '../abi/LiquidityBootstrappingPool.json';
import ComposableStablePoolAbi from '../abi/ComposableStablePool.json';
import GyroEV2Abi from '../abi/GyroEV2.json';
import VaultAbi from '../abi/Vault.json';
import aTokenRateProvider from '../abi/StaticATokenRateProvider.json';
import WeightedPoolAbi from '../abi/WeightedPool.json';
import StablePoolAbi from '../abi/StablePool.json';
import MetaStablePoolAbi from '../abi/MetaStablePool.json';
import StablePhantomPoolAbi from '../abi/StablePhantomPool.json';
import BalancerQueries from '../abi/BalancerQueries.json';
import { filter, result } from 'lodash';
import { ZERO_ADDRESS } from '@balancer/sdk';
import { parseUnits } from 'viem';

interface PoolInput {
    id: string;
    address: string;
    tokens: {
        address: string;
        token: {
            decimals: number;
        };
        dynamicData: {
            balance: string;
            balanceUSD: number;
        } | null;
    }[];
    dynamicData: {
        totalLiquidity: number;
    } | null;
}

interface PoolOutput {
    id: string;
    tokenPairs: TokenPair[];
}

interface TokenPair {
    poolId: string;
    tokenA: Token;
    tokenB: Token;
    normalizedLiqudity: string;
    aToBPrice: string;
    bToAPrice: string;
    spotPrice: string;
    effectivePrice: string;
}

interface Token {
    address: string;
    decimals: number;
    balance: string;
    balanceUsd: number;
}

interface OnchainData {
    effectivePrice: BigNumber;
    aToBPrice: BigNumber;
    bToAPrice: BigNumber;
}

export async function fetchNormalizedLiquidity(pools: PoolInput[], balancerQueriesAddress: string, batchSize = 1024) {
    if (pools.length === 0) {
        return {};
    }

    const multicaller = new Multicaller3(BalancerQueries, batchSize);

    // only inlcude pools with TVL >=$1000
    // for each pool, get pairs
    // for each pair per pool, create multicall to do a swap with $200 (min liq is $1k, so there should be at least $200 for each token) for effectivePrice calc and a swap with 1% TVL
    //     then create multicall to do the second swap for each pair using the result of the first 1% swap as input, to calculate the spot price
    // https://github.com/balancer/b-sdk/pull/204/files#diff-52e6d86a27aec03f59dd3daee140b625fd99bd9199936bbccc50ee550d0b0806

    // remove pools that have <$1000 TVL or a token without a balance or USD balance
    const filteredPools = pools.filter(
        (pool) =>
            pool.dynamicData?.totalLiquidity ||
            0 >= 1000 ||
            pool.tokens.some((token) => token.dynamicData?.balance || '0' === '0') ||
            pool.tokens.some((token) => token.dynamicData?.balanceUSD || 0 === 0),
    );
    const tokenPairs = generateTokenPairs(filteredPools);

    tokenPairs.forEach((tokenPair) => {
        addEffectivePriceCallsToMulticaller(tokenPair, balancerQueriesAddress, multicaller);
        addAToBePriceCallsToMulticaller(tokenPair, balancerQueriesAddress, multicaller);
    });

    const resultOne = (await multicaller.execute()) as {
        [id: string]: OnchainData;
    };

    tokenPairs.forEach((tokenPair) => {
        tokenPair.aToBPrice = getAtoBPriceForPair(tokenPair, resultOne);
        tokenPair.effectivePrice = getEffectivePriceForPair(tokenPair, resultOne);
    });

    console.log(resultOne);
}

function generateTokenPairs(filteredPools: PoolInput[]): TokenPair[] {
    const tokenPairs: TokenPair[] = [];

    for (const pool of filteredPools) {
        // search for and delete phantom BPT if present
        let index: number | undefined = undefined;
        pool.tokens.forEach((poolToken, i) => {
            if (poolToken.address === pool.address) {
                index = i;
            }
        });
        if (index) {
            pool.tokens.splice(index, 1);
        }

        // create all pairs for pool
        for (let i = 0; i < pool.tokens.length - 1; i++) {
            for (let j = i + 1; j < pool.tokens.length; j++) {
                tokenPairs.push({
                    poolId: pool.id,
                    tokenA: {
                        address: pool.tokens[i].address,
                        decimals: pool.tokens[i].token.decimals,
                        balance: pool.tokens[i].dynamicData?.balance || '0',
                        balanceUsd: pool.tokens[i].dynamicData?.balanceUSD || 0,
                    },
                    tokenB: {
                        address: pool.tokens[j].address,
                        decimals: pool.tokens[j].token.decimals,
                        balance: pool.tokens[j].dynamicData?.balance || '0',
                        balanceUsd: pool.tokens[j].dynamicData?.balanceUSD || 0,
                    },
                    normalizedLiqudity: '0',
                    spotPrice: '0',
                    aToBPrice: '0',
                    bToAPrice: '0',
                    effectivePrice: '0',
                });
            }
        }
    }
    return tokenPairs;
}

// call querySwap from tokenA->tokenB with 100USD worth of tokenA
function addEffectivePriceCallsToMulticaller(
    tokenPair: TokenPair,
    balancerQueriesAddress: string,
    multicaller: Multicaller3,
) {
    const oneHundredUsdOfTokenA = (parseFloat(tokenPair.tokenA.balance) / tokenPair.tokenA.balanceUsd) * 100;
    const amountScaled = parseUnits(`${oneHundredUsdOfTokenA}`, tokenPair.tokenA.decimals);

    multicaller.call(
        `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.effectivePrice`,
        balancerQueriesAddress,
        'querySwap',
        [
            [tokenPair.poolId, 0, tokenPair.tokenA.address, tokenPair.tokenB.address, `${amountScaled}`, ZERO_ADDRESS],
            [ZERO_ADDRESS, false, ZERO_ADDRESS, false],
        ],
    );
}

// call querySwap from tokenA->tokenB with 1% of tokenA balance
function addAToBePriceCallsToMulticaller(
    tokenPair: TokenPair,
    balancerQueriesAddress: string,
    multicaller: Multicaller3,
) {
    const amountScaled = parseUnits(tokenPair.tokenA.balance, tokenPair.tokenA.decimals) / 100n;

    multicaller.call(
        `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.aToBPrice`,
        balancerQueriesAddress,
        'querySwap',
        [
            [tokenPair.poolId, 0, tokenPair.tokenA.address, tokenPair.tokenB.address, `${amountScaled}`, ZERO_ADDRESS],
            [ZERO_ADDRESS, false, ZERO_ADDRESS, false],
        ],
    );
}
function getAtoBPriceForPair(tokenPair: TokenPair, resultOne: { [id: string]: OnchainData }): string {}

function getEffectivePriceForPair(tokenPair: TokenPair, resultOne: { [id: string]: OnchainData }): string {
    throw new Error('Function not implemented.');
}
