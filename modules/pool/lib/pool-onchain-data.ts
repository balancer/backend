import { formatEther, formatUnits } from 'ethers/lib/utils';
import { Chain, PrismaPoolType } from '@prisma/client';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import ElementPoolAbi from '../abi/ConvergentCurvePool.json';
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
import { Multicaller3Viem, IMulticaller } from '../../web3/multicaller-viem';

interface PoolInput {
    id: string;
    chain: Chain;
    address: string;
    type: PrismaPoolType | 'COMPOSABLE_STABLE';
    tokens: {
        address: string;
        token: {
            decimals: number;
        };
    }[];
    version: number;
}

interface OnchainData {
    poolTokens: [string[], bigint[]];
    totalSupply: bigint;
    swapFee: bigint;
    swapEnabled?: boolean;
    protocolYieldFeePercentageCache?: bigint;
    protocolSwapFeePercentageCache?: bigint;
    rate?: bigint;
    weights?: bigint[];
    targets?: [bigint, bigint];
    wrappedTokenRate?: bigint;
    amp?: [bigint, boolean, bigint];
    tokenRates?: [bigint, bigint];
    tokenRate?: bigint[];
    metaPriceRateCache?: [bigint, bigint, bigint][];
}

const abi: JsonFragment[] = Object.values(
    // Remove duplicate entries using their names
    Object.fromEntries(
        [
            ...ElementPoolAbi,
            ...LiquidityBootstrappingPoolAbi,
            ...ComposableStablePoolAbi,
            ...GyroEV2Abi,
            ...VaultAbi,
            ...aTokenRateProvider,
            ...WeightedPoolAbi,
            ...StablePoolAbi,
            ...StablePhantomPoolAbi,
            ...MetaStablePoolAbi,
            ...ComposableStablePoolAbi,
            ...FxPoolAbi,
            //...WeightedPoolV2Abi,
        ].map((row) => [row.name, row]),
    ),
);

const getSwapFeeFn = (type: string) => {
    if (type === 'ELEMENT') {
        return 'percentFee';
    } else if (type === 'FX') {
        return 'protocolPercentFee';
    } else {
        return 'getSwapFeePercentage';
    }
};

const getTotalSupplyFn = (type: PoolInput['type'], version: number) => {
    if (type === 'COMPOSABLE_STABLE' && version === 0) {
        return 'getVirtualSupply';
    } else if (
        type === 'COMPOSABLE_STABLE' ||
        (type === 'WEIGHTED' && version > 1) ||
        (type === 'UNKNOWN' && version > 1)
    ) {
        return 'getActualSupply';
    } else {
        return 'totalSupply';
    }
};

const addDefaultCallsToMulticaller = (
    { id, address, type, version }: PoolInput,
    vaultAddress: string,
    multicaller: IMulticaller,
) => {
    multicaller.call(`${id}.poolTokens`, vaultAddress, 'getPoolTokens', [id]);
    multicaller.call(`${id}.totalSupply`, address, getTotalSupplyFn(type, version));
    multicaller.call(`${id}.swapFee`, address, getSwapFeeFn(type));
    multicaller.call(`${id}.rate`, address, 'getRate');
    multicaller.call(`${id}.protocolSwapFeePercentageCache`, address, 'getProtocolFeePercentageCache', [0]);
    multicaller.call(`${id}.protocolYieldFeePercentageCache`, address, 'getProtocolFeePercentageCache', [2]);
};

const weightedCalls = ({ id, address }: PoolInput, multicaller: IMulticaller) => {
    multicaller.call(`${id}.weights`, address, 'getNormalizedWeights', [], false);
};

const lbpAndInvestmentCalls = ({ id, address }: PoolInput, multicaller: IMulticaller) => {
    multicaller.call(`${id}.weights`, address, 'getNormalizedWeights');
    multicaller.call(`${id}.swapEnabled`, address, 'getSwapEnabled');
};

const stableCalls = ({ id, address, tokens }: PoolInput, multicaller: IMulticaller) => {
    multicaller.call(`${id}.amp`, address, 'getAmplificationParameter');

    tokens.forEach(({ address: tokenAddress }, i) => {
        multicaller.call(`${id}.tokenRate[${i}]`, address, 'getTokenRate', [tokenAddress]);
    });
};

const metaStableCalls = ({ id, address, tokens }: PoolInput, multicaller: IMulticaller) => {
    multicaller.call(`${id}.amp`, address, 'getAmplificationParameter');

    tokens.forEach(({ address: tokenAddress }, i) => {
        multicaller.call(`${id}.metaPriceRateCache[${i}]`, address, 'getPriceRateCache', [tokenAddress]);
    });
};

const gyroECalls = ({ id, address }: PoolInput, multicaller: IMulticaller) => {
    multicaller.call(`${id}.tokenRates`, address, 'getTokenRates');
};

const addPoolTypeSpecificCallsToMulticaller = (type: PoolInput['type'], version = 1) => {
    const do_nothing = () => ({});
    switch (type) {
        case 'WEIGHTED':
            return weightedCalls;
        case 'LIQUIDITY_BOOTSTRAPPING':
        case 'INVESTMENT':
            return lbpAndInvestmentCalls;
        case 'STABLE':
        case 'PHANTOM_STABLE':
        case 'COMPOSABLE_STABLE':
            return stableCalls;
        case 'META_STABLE':
            return metaStableCalls;
        case 'GYRO':
        case 'GYROE':
            if (version === 2) {
                return gyroECalls;
            } else {
                return do_nothing;
            }
        default:
            return do_nothing;
    }
};

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
                      : result.metaPriceRateCache && result.metaPriceRateCache[i][0] > 0n
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

export const fetchOnChainPoolData = async (pools: PoolInput[], vaultAddress: string, batchSize = 400) => {
    if (pools.length === 0) {
        return {};
    }

    const multicaller = new Multicaller3Viem(pools[0].chain, abi, batchSize);

    pools.forEach((pool) => {
        addDefaultCallsToMulticaller(pool, vaultAddress, multicaller);
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
