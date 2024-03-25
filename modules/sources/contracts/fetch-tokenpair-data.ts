import { BigNumber } from '@ethersproject/bignumber';
import { MathSol, WAD, ZERO_ADDRESS } from '@balancer/sdk';
import { parseEther, parseUnits } from 'viem';
import * as Sentry from '@sentry/node';
import { ViemClient } from '../types';
import { ViemMulticallCall, multicallViem } from '../../web3/multicaller-viem';
import BalancerRouterAbi from './abis/BalancerRouter';

interface PoolInput {
    id: string;
    address: string;
    vaultVersion: number;
    tokens: {
        address: string;
        index: number;
        token: {
            decimals: number;
        };
        dynamicData: {
            balance: string;
            balanceUSD: number;
        } | null;
    }[];
    dynamicData: {
        totalShares: string;
        totalLiquidity: number;
    } | null;
}

interface PoolTokenPairsOutput {
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

interface TokenPair {
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
    tokenBIndex?: number; // Necessary only for BPT token pairs (AddLiquidityUnbalanced calls)
    poolTokensLength?: number; // Necessary only for BPT token pairs (AddLiquidityUnbalanced calls)
}

interface Token {
    address: string;
    decimals: number;
    balance: string;
    balanceUsd: number;
}

interface OnchainData {
    effectivePriceAmountOut: BigNumber;
    aToBAmountOut: BigNumber;
    bToAAmountOut: BigNumber;
}

export async function fetchTokenPairData(
    routerAddress: string,
    pools: PoolInput[],
    client: ViemClient,
): Promise<PoolTokenPairsOutput> {
    if (pools.length === 0) {
        return {};
    }

    const tokenPairOutput: PoolTokenPairsOutput = {};

    let multicallerRouter: ViemMulticallCall[] = [];
    // only inlcude pools with TVL >=$1000
    // for each pool, get pairs
    // for each pair per pool, create multicall to do a swap with $100 (min liq is $1k, so there should be at least $100 for each token) for effectivePrice calc and a swap with 1% TVL
    //     then create multicall to do the second swap for each pair using the result of the first 1% swap as input, to calculate the spot price
    // https://github.com/balancer/b-sdk/pull/204/files#diff-52e6d86a27aec03f59dd3daee140b625fd99bd9199936bbccc50ee550d0b0806

    let tokenPairs = generateTokenPairs(pools);
    tokenPairs.forEach((tokenPair) => {
        if (tokenPair.valid) {
            // prepare swap amounts in
            // tokenA->tokenB with 1% of tokenA balance
            tokenPair.aToBAmountIn = parseUnits(tokenPair.tokenA.balance, tokenPair.tokenA.decimals) / 100n;
            // tokenA->tokenB with 100USD worth of tokenA
            const oneHundredUsdOfTokenA = (parseFloat(tokenPair.tokenA.balance) / tokenPair.tokenA.balanceUsd) * 100;
            tokenPair.effectivePriceAmountIn = parseUnits(`${oneHundredUsdOfTokenA}`, tokenPair.tokenA.decimals);

            addEffectivePriceCallsToMulticaller(tokenPair, routerAddress, multicallerRouter);
            addAToBPriceCallsToMulticaller(tokenPair, routerAddress, multicallerRouter);
        }
    });
    
    let bptTokenPairs = generateBptTokenPairs(pools);
    bptTokenPairs.forEach((bptTokenPair) => {
        if (bptTokenPair.valid) {
            // prepare swap amounts in
            // tokenA->tokenB with 1% of tokenA balance
            bptTokenPair.aToBAmountIn = parseUnits(bptTokenPair.tokenA.balance, bptTokenPair.tokenA.decimals) / 100n;
            // tokenA->tokenB with 100USD worth of tokenA
            const oneHundredUsdOfTokenA = (parseFloat(bptTokenPair.tokenA.balance) / bptTokenPair.tokenA.balanceUsd) * 100;
            bptTokenPair.effectivePriceAmountIn = parseUnits(`${oneHundredUsdOfTokenA}`, bptTokenPair.tokenA.decimals);

            addBptEffectivePriceCallsToMulticaller(bptTokenPair, routerAddress, multicallerRouter);
            addBptAToBPriceCallsToMulticaller(bptTokenPair, routerAddress, multicallerRouter);
        }
    });
    
    const resultOne = (await multicallViem(client, multicallerRouter)) as {
        [id: string]: OnchainData;
    };
    
    [...tokenPairs, ...bptTokenPairs].forEach((tokenPair) => {
        if (tokenPair.valid) {
            getAmountOutAndEffectivePriceFromResult(tokenPair, resultOne);
        }
    });

    multicallerRouter = [];
    tokenPairs.forEach((tokenPair) => {
        if (tokenPair.valid) {
            addBToAPriceCallsToMulticaller(tokenPair, routerAddress, multicallerRouter);
        }
    });

    bptTokenPairs.forEach((tokenPair) => {
        if (tokenPair.valid) {
            addBptBToAPriceCallsToMulticaller(tokenPair, routerAddress, multicallerRouter);
        }
    });
    
    const resultTwo = (await multicallViem(client, multicallerRouter)) as {
        [id: string]: OnchainData;
    };
    [...tokenPairs, ...bptTokenPairs].forEach((tokenPair) => {
        if (tokenPair.valid) {
            getBToAAmountFromResult(tokenPair, resultTwo);
            calculateSpotPrice(tokenPair);
            calculateNormalizedLiquidity(tokenPair);
        }

        // prepare output
        pools.forEach((pool) => {
            if (pool.id === tokenPair.poolId) {
                if (!tokenPairOutput[pool.id]) {
                    tokenPairOutput[pool.id] = {
                        tokenPairs: [],
                    };
                }
                tokenPairOutput[pool.id].tokenPairs.push({
                    tokenA: tokenPair.tokenA.address,
                    tokenB: tokenPair.tokenB.address,
                    normalizedLiquidity: tokenPair.normalizedLiqudity.toString(),
                    spotPrice: tokenPair.spotPrice.toString(),
                });
            }
        });
    });

    return tokenPairOutput;
}

function generateTokenPairs(filteredPools: PoolInput[]): TokenPair[] {
    const tokenPairs: TokenPair[] = [];
    
    for (const pool of filteredPools) {
        // create all pairs for pool
        for (let i = 0; i < pool.tokens.length - 1; i++) {
            for (let j = i + 1; j < pool.tokens.length; j++) {
                //we only want pairs of the tokens in the pool, not pairing with its own phantom bpt
                if (pool.tokens[i].address === pool.address || pool.tokens[j].address === pool.address) continue;
                tokenPairs.push({
                    poolId: pool.id,
                    poolTvl: pool.dynamicData?.totalLiquidity || 0,
                    // remove pools that have <$1000 TVL or a token without a balance or USD balance
                    valid:
                        // V2 Validation
                        (pool.dynamicData?.totalLiquidity || 0) >= 1000 &&
                        !pool.tokens.some((token) => (token.dynamicData?.balance || '0') === '0') &&
                        !pool.tokens.some((token) => (token.dynamicData?.balanceUSD || 0) === 0),

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
                    normalizedLiqudity: 0n,
                    spotPrice: 0n,
                    aToBAmountIn: 0n,
                    aToBAmountOut: 0n,
                    bToAAmountOut: 0n,
                    effectivePrice: 0n,
                    effectivePriceAmountIn: 0n,
                });
            }
        }
    }
    return tokenPairs;
}

function generateBptTokenPairs(filteredPools: PoolInput[]): TokenPair[] {
    const bptTokenPairs: TokenPair[] = [];

    for (const pool of filteredPools) {
        // add/remove liquidity will only be included in the SOR Paths if the V3 Pools 
        if(pool.vaultVersion!==3) continue;
        for(const poolToken of pool.tokens){
        // create all pairs for pool's bpt
        //we don't want a pair of the bpt with itself
        if (poolToken.address === pool.address || poolToken.address === pool.address) continue;
        bptTokenPairs.push({
            poolId: pool.id,
            poolTvl: pool.dynamicData?.totalLiquidity || 0,
            // remove pools that have <$1000 TVL or a token without a balance or USD balance
            valid:
            // V2 Validation
              (pool.dynamicData?.totalLiquidity || 0) >= 1000 &&
              !pool.tokens.some((token) => (token.dynamicData?.balance || '0') === '0') &&
              !pool.tokens.some((token) => (token.dynamicData?.balanceUSD || 0) === 0),

            tokenA: {
                address: pool.address,
                decimals: 18,
                balance: pool.dynamicData?.totalShares || '0',
                balanceUsd: pool.dynamicData?.totalLiquidity || 0,
            },
            tokenB: {
                address: poolToken.address,
                decimals: poolToken.token.decimals,
                balance: poolToken.dynamicData?.balance || '0',
                balanceUsd: poolToken.dynamicData?.balanceUSD || 0,
            },
            normalizedLiqudity: 0n,
            spotPrice: 0n,
            aToBAmountIn: 0n,
            aToBAmountOut: 0n,
            bToAAmountOut: 0n,
            effectivePrice: 0n,
            effectivePriceAmountIn: 0n,
            tokenBIndex: poolToken.index,
            poolTokensLength: pool.tokens.length,
        });
        }
    }
    return bptTokenPairs;
}

// call querySwapSingleTokenExactIn from tokenA->tokenB with 100USD worth of tokenA
function addEffectivePriceCallsToMulticaller(
  tokenPair: TokenPair,
  balancerRouterAddress: string,
  multicaller: ViemMulticallCall[],
) {
    multicaller.push({
        path: `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.effectivePriceAmountOut`,
        address: balancerRouterAddress as `0x${string}`,
        functionName: 'querySwapSingleTokenExactIn',
        abi: BalancerRouterAbi,
        args: [
            tokenPair.poolId,
            tokenPair.tokenA.address,
            tokenPair.tokenB.address,
            tokenPair.effectivePriceAmountIn,
            ZERO_ADDRESS,
        ],
    });
}

// call queryRemoveLiquiditySingleTokenExactIn from tokenA(BPT)->tokenB with 100USD worth of BPT
function addBptEffectivePriceCallsToMulticaller(
  tokenPair: TokenPair,
  balancerRouterAddress: string,
  multicaller: ViemMulticallCall[],
) {
    multicaller.push({
        path: `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.effectivePriceAmountOut`,
        address: balancerRouterAddress as `0x${string}`,
        functionName: 'queryRemoveLiquiditySingleTokenExactIn',
        abi: BalancerRouterAbi,
        args: [
            tokenPair.poolId,
            tokenPair.effectivePriceAmountIn,
            tokenPair.tokenB.address,
            ZERO_ADDRESS,
        ],
    });
}

// call querySwapSingleTokenExactIn from tokenA->tokenB with 1% of tokenA balance
function addAToBPriceCallsToMulticaller(
    tokenPair: TokenPair,
    balancerRouterAddress: string,
    multicaller: ViemMulticallCall[],
) {
    multicaller.push({
        path: `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.aToBAmountOut`,
        address: balancerRouterAddress as `0x${string}`,
        functionName: 'querySwapSingleTokenExactIn',
        abi: BalancerRouterAbi,
        args: [
            tokenPair.poolId,
            tokenPair.tokenA.address,
            tokenPair.tokenB.address,
            tokenPair.aToBAmountIn,
            ZERO_ADDRESS,
        ],
    });
}

// call querySwapSingleTokenExactIn from tokenA->tokenB with 1% of tokenA balance
function addBptAToBPriceCallsToMulticaller(
  tokenPair: TokenPair,
  balancerRouterAddress: string,
  multicaller: ViemMulticallCall[],
) {
    multicaller.push({
        path: `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.aToBAmountOut`,
        address: balancerRouterAddress as `0x${string}`,
        functionName: 'queryRemoveLiquiditySingleTokenExactIn',
        abi: BalancerRouterAbi,
        args: [
            tokenPair.poolId,
            tokenPair.aToBAmountIn,
            tokenPair.tokenB.address,
            ZERO_ADDRESS,
        ],
    });
}

function addBToAPriceCallsToMulticaller(
    tokenPair: TokenPair,
    balancerRouterAddress: string,
    multicaller: ViemMulticallCall[],
) {
    multicaller.push({
        path: `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.bToAAmountOut`,
        address: balancerRouterAddress as `0x${string}`,
        functionName: 'querySwapSingleTokenExactIn',
        abi: BalancerRouterAbi,
        args: [
            tokenPair.poolId,
            tokenPair.tokenB.address,
            tokenPair.tokenA.address,
            `${tokenPair.aToBAmountOut}`,
            ZERO_ADDRESS,
        ],
    });
}

function addBptBToAPriceCallsToMulticaller(
  tokenPair: TokenPair,
  balancerRouterAddress: string,
  multicaller: ViemMulticallCall[],
) {
    if(tokenPair.tokenBIndex === undefined || tokenPair.poolTokensLength === undefined){
        return;
    }
    let amountsIn = new Array(tokenPair.poolTokensLength).fill(0)
    amountsIn[tokenPair.tokenBIndex] = tokenPair.aToBAmountOut
    multicaller.push({
        path: `${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}.bToAAmountOut`,
        address: balancerRouterAddress as `0x${string}`,
        functionName: 'queryAddLiquidityUnbalanced',
        abi: BalancerRouterAbi,
        args: [
            tokenPair.poolId,
            amountsIn,
            ZERO_ADDRESS,
        ],
    });
}

function getAmountOutAndEffectivePriceFromResult(tokenPair: TokenPair, onchainResults: { [id: string]: OnchainData }) {
    const result = onchainResults[`${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}`];

    if (result && result.effectivePriceAmountOut && result.aToBAmountOut) {
        tokenPair.aToBAmountOut = BigInt(result.aToBAmountOut.toString());
        // MathSol expects all values with 18 decimals, need to scale them
        tokenPair.effectivePrice = MathSol.divDownFixed(
            parseUnits(tokenPair.effectivePriceAmountIn.toString(), 18 - tokenPair.tokenA.decimals),
            parseUnits(result.effectivePriceAmountOut?.toString(), 18 - tokenPair.tokenB.decimals),
        );
    }
}

function getBToAAmountFromResult(tokenPair: TokenPair, onchainResults: { [id: string]: OnchainData }) {
    const result = onchainResults[`${tokenPair.poolId}-${tokenPair.tokenA.address}-${tokenPair.tokenB.address}`];

    if (result && result.bToAAmountOut) {
        tokenPair.bToAAmountOut = BigInt(result.bToAAmountOut.toString());
    }
}
function calculateSpotPrice(tokenPair: TokenPair) {
    // MathSol expects all values with 18 decimals, need to scale them
    const aToBAmountInScaled = parseUnits(tokenPair.aToBAmountIn.toString(), 18 - tokenPair.tokenA.decimals);
    const aToBAmountOutScaled = parseUnits(tokenPair.aToBAmountOut.toString(), 18 - tokenPair.tokenB.decimals);
    const bToAAmountOutScaled = parseUnits(tokenPair.bToAAmountOut.toString(), 18 - tokenPair.tokenA.decimals);
    if (aToBAmountInScaled !== 0n && aToBAmountOutScaled !== 0n && bToAAmountOutScaled !== 0n) {
        const priceAtoB = MathSol.divDownFixed(aToBAmountInScaled, aToBAmountOutScaled);
        const priceBtoA = MathSol.divDownFixed(aToBAmountOutScaled, bToAAmountOutScaled);
        tokenPair.spotPrice = MathSol.powDownFixed(MathSol.divDownFixed(priceAtoB, priceBtoA), WAD / 2n);
    } else {
        // this happens if any of the swaps reverted on-chain. Either the tokenBalance in the pool was <100 USD or RPC failed.
        tokenPair.spotPrice = 0n;
    }
}

// TODO this seems to yield positive price impact for all pairs, meaning all pools have the same normalized liquidity
function calculateNormalizedLiquidity(tokenPair: TokenPair) {
    // spotPrice and effective price are already scaled to 18 decimals by the MathSol output
    let priceRatio = MathSol.divDownFixed(tokenPair.spotPrice, tokenPair.effectivePrice);
    // if priceRatio is = 1, normalizedLiquidity becomes infinity, if it is >1, normalized liqudity becomes negative. Need to cap it.
    // this happens if you get a "bonus" ie positive price impact.
    if (priceRatio > parseEther('0.999999')) {
        Sentry.captureException(
            `Price ratio was > 0.999999 for token pair ${tokenPair.tokenA.address}/${tokenPair.tokenB.address} in pool ${tokenPair.poolId}.`,
        );
        console.log(
            `Price ratio was > 0.999999 for token pair ${tokenPair.tokenA.address}/${tokenPair.tokenB.address} in pool ${tokenPair.poolId}.`,
        );
        priceRatio = parseEther('0.999999');
    }
    if (priceRatio !== 0n) {
        const priceImpact = WAD - priceRatio;
        tokenPair.normalizedLiqudity = MathSol.divDownFixed(WAD, priceImpact);
    } else {
        // can happen if the pair could not be priced on-chain and everything is 0 (aToBAmount, effectivePrice, etc) and hence the spotPrice is 0.
        // if that happens, normalizedLiquidity should be 0 as well.
        tokenPair.normalizedLiqudity = 0n;
    }
}
