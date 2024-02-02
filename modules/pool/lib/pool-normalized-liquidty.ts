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
import FxPoolAbi from '../abi/FxPool.json';
import { JsonFragment } from '@ethersproject/abi';

interface PoolInput {
    id: string;
    address: string;
    type: PrismaPoolType;
    tokens: {
        address: string;
        token: {
            decimals: number;
        };
    }[];
    dynamicData:{
        totalLiquidity: string;
    };
    version: number;
}

interface OnchainData {
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


const parse = (result: OnchainData, decimalsLookup: { [address: string]: number }) => ({
    amp: result.amp ? formatFixed(result.amp[0], String(result.amp[2]).length - 1) : undefined,
    swapFee: formatEther(result.swapFee ?? '0'),
    totalShares: formatEther(result.totalSupply || '0'),
    weights: result.weights?.map(formatEther),
    targets: result.targets?.map(String),
    poolTokens: result.poolTokens
        ? {
              tokens: result.poolTokens[0].map((token) => token.toLowerCase()),
              balances: result.poolTokens[1].map((balance, i) =>
                  formatUnits(balance, decimalsLookup[result.poolTokens[0][i].toLowerCase()]),
              ),
              rates: result.poolTokens[0].map((_, i) =>
                  result.tokenRate && result.tokenRate[i]
                      ? formatEther(result.tokenRate[i])
                      : result.tokenRates && result.tokenRates[i]
                      ? formatEther(result.tokenRates[i])
                      : result.metaPriceRateCache && result.metaPriceRateCache[i][0].gt(0)
                      ? formatEther(result.metaPriceRateCache[i][0])
                      : undefined,
              ),
          }
        : { tokens: [], balances: [], rates: [] },
    wrappedTokenRate: result.wrappedTokenRate ? formatEther(result.wrappedTokenRate) : '1.0',
    rate: result.rate ? formatEther(result.rate) : '1.0',
    swapEnabled: result.swapEnabled,
    protocolYieldFeePercentageCache: result.protocolYieldFeePercentageCache
        ? formatEther(result.protocolYieldFeePercentageCache)
        : undefined,
    protocolSwapFeePercentageCache: result.protocolSwapFeePercentageCache
        ? formatEther(result.protocolSwapFeePercentageCache)
        : undefined,
});

export const fetchNormalizedLiquidity = async (
    pools: PoolInput[],
    balancerQueriesAddress: string,
    batchSize = 1024,
) => {
    if (pools.length === 0) {
        return {};
    }

    const multicaller = new Multicaller3(abi, batchSize);

    for

    // only inlcude pools with TVL >=$1000
    // for each pool, get pairs
    // for each pair per pool, swap $500 amount from a->b
    // for each pair per pool, swap result of above back b->a
    // calc normalizedLiquidity

    pools.forEach((pool) => {
        addDefaultCallsToMulticaller(pool, balancerQueriesAddress, multicaller);
        addPoolTypeSpecificCallsToMulticaller(pool.type, pool.version)(pool, multicaller);
    });

    const results = (await multicaller.execute()) as {
        [id: string]: OnchainData;
    };

    const decimalsLookup = Object.fromEntries(
        pools.flatMap((pool) => pool.tokens.map(({ address, token }) => [address, token.decimals])),
    );

    const parsed = Object.fromEntries(
        Object.entries(results).map(([key, result]) => [key, parse(result, decimalsLookup)]),
    );

    return parsed;
};
