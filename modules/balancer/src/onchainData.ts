import { formatFixed } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import VaultAbi from '../abi/Vault.json';
import aTokenRateProvider from '../abi/StaticATokenRateProvider.json';
import WeightedPoolAbi from '../abi/WeightedPool.json';
import StablePoolAbi from '../abi/StablePool.json';
import ElementPoolAbi from '../abi/ConvergentCurvePool.json';
import LinearPoolAbi from '../abi/LinearPool.json';
import StablePhantomPoolAbi from '../abi/StablePhantomPool.json';
import LiquidityBootstrappingPoolAbi from '../abi/LiquidityBootstrappingPool.json';
import { getAddress } from 'ethers/lib/utils';
import { Multicaller } from '../../util/multicaller';
import { GqlBalancerPool } from '../../../schema';
import { BigNumber } from 'ethers';

enum PoolFilter {
    All = 'All',
    Weighted = 'Weighted',
    Stable = 'Stable',
    MetaStable = 'MetaStable',
    LBP = 'LiquidityBootstrapping',
    Investment = 'Investment',
    Element = 'Element',
    Linear = 'Linear',
    StablePhantom = 'StablePhantom',
}

interface MulticallExecuteResult {
    amp?: string[];
    swapFee: string;
    totalSupply: string;
    weights?: string[];
    targets?: string[];
    poolTokens: {
        tokens: string[];
        balances: string[];
    };
    rate?: string;
    swapEnabled?: boolean;
    tokenRates?: BigNumber[];
    linearPools?: Record<
        string,
        {
            id: string;
            priceRate: string;
            totalSupply: string;
            mainToken: { address: string; index: BigNumber };
            wrappedToken: { address: string; index: BigNumber; rate: string };
        }
    >;
}

export async function getOnChainBalances(
    subgraphPoolsOriginal: GqlBalancerPool[],
    multiAddress: string,
    vaultAddress: string,
    provider: Provider,
): Promise<GqlBalancerPool[]> {
    if (subgraphPoolsOriginal.length === 0) return [];

    const abis: any = Object.values(
        // Remove duplicate entries using their names
        Object.fromEntries(
            [
                ...VaultAbi,
                ...aTokenRateProvider,
                ...WeightedPoolAbi,
                ...StablePoolAbi,
                ...ElementPoolAbi,
                ...LinearPoolAbi,
                ...LiquidityBootstrappingPoolAbi,
                ...StablePhantomPoolAbi,
            ].map((row) => [row.name, row]),
        ),
    );

    const multiPool = new Multicaller(multiAddress, provider, abis);

    const supportedPoolTypes: string[] = Object.values(PoolFilter);
    const subgraphPools: GqlBalancerPool[] = [];

    subgraphPoolsOriginal.forEach((pool) => {
        if (!supportedPoolTypes.includes(pool.poolType || '')) {
            console.error(`Unknown pool type: ${pool.poolType} ${pool.id}`);
            return;
        }

        subgraphPools.push(pool);

        multiPool.call(`${pool.id}.poolTokens`, vaultAddress, 'getPoolTokens', [pool.id]);
        multiPool.call(`${pool.id}.totalSupply`, pool.address, 'totalSupply');

        // TO DO - Make this part of class to make more flexible?
        if (
            pool.poolType === 'Weighted' ||
            pool.poolType === 'LiquidityBootstrapping' ||
            pool.poolType === 'Investment'
        ) {
            multiPool.call(`${pool.id}.weights`, pool.address, 'getNormalizedWeights');
            multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFeePercentage');
        } else if (pool.poolType === 'Stable' || pool.poolType === 'MetaStable' || pool.poolType === 'StablePhantom') {
            // MetaStable & StablePhantom is the same as Stable for multicall purposes
            multiPool.call(`${pool.id}.amp`, pool.address, 'getAmplificationParameter');
            multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFeePercentage');
        } else if (pool.poolType === 'Element') {
            multiPool.call(`${pool.id}.swapFee`, pool.address, 'percentFee');
        } else if (pool.poolType === 'Linear') {
            multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFeePercentage');

            multiPool.call(`${pool.id}.targets`, pool.address, 'getTargets');
            multiPool.call(`${pool.id}.rate`, pool.address, 'getWrappedTokenRate');
        }

        if (pool.poolType === 'LiquidityBootstrapping' || pool.poolType === 'Investment') {
            multiPool.call(`${pool.id}.swapEnabled`, pool.address, 'getSwapEnabled');
        }

        if (pool.poolType === 'StablePhantom') {
            // Overwrite totalSupply with virtualSupply for StablePhantom pools
            multiPool.call(`${pool.id}.totalSupply`, pool.address, 'getVirtualSupply');
            const tokenAddresses = (pool.tokens || []).map((token) => token.address);

            tokenAddresses.forEach((token, i) => {
                multiPool.call(`${pool.id}.tokenRates[${i}]`, pool.address, 'getTokenRate', [token]);

                if (token.toLowerCase() !== pool.address.toLowerCase()) {
                    multiPool.call(`${pool.id}.linearPools.${token}.id`, token, 'getPoolId');
                    multiPool.call(`${pool.id}.linearPools.${token}.priceRate`, token, 'getRate');
                    multiPool.call(`${pool.id}.linearPools.${token}.totalSupply`, token, 'getVirtualSupply');
                    multiPool.call(`${pool.id}.linearPools.${token}.mainToken.address`, token, 'getMainToken');
                    multiPool.call(`${pool.id}.linearPools.${token}.mainToken.index`, token, 'getMainIndex');
                    multiPool.call(`${pool.id}.linearPools.${token}.wrappedToken.address`, token, 'getWrappedToken');
                    multiPool.call(`${pool.id}.linearPools.${token}.wrappedToken.index`, token, 'getWrappedIndex');
                    multiPool.call(`${pool.id}.linearPools.${token}.wrappedToken.rate`, token, 'getWrappedTokenRate');
                }
            });
        }
    });

    let pools = {} as Record<string, MulticallExecuteResult>;

    try {
        pools = (await multiPool.execute()) as Record<string, MulticallExecuteResult>;
    } catch (err) {
        console.error(err);
        throw `Issue with multicall execution.`;
    }

    const onChainPools: GqlBalancerPool[] = [];

    Object.entries(pools).forEach(([poolId, onchainData], index) => {
        try {
            const { poolTokens, swapFee, weights, swapEnabled, totalSupply } = onchainData;

            if (
                subgraphPools[index].poolType === 'Stable' ||
                subgraphPools[index].poolType === 'MetaStable' ||
                subgraphPools[index].poolType === 'StablePhantom'
            ) {
                if (!onchainData.amp) {
                    console.error(`Stable Pool Missing Amp: ${poolId}`);
                    return;
                } else {
                    // Need to scale amp by precision to match expected Subgraph scale
                    // amp is stored with 3 decimals of precision
                    subgraphPools[index].amp = formatFixed(onchainData.amp[0], 3);
                }
            }

            if (subgraphPools[index].poolType === 'Linear') {
                if (!onchainData.targets) {
                    console.error(`Linear Pool Missing Targets: ${poolId}`);
                    return;
                } else {
                    subgraphPools[index].lowerTarget = formatFixed(onchainData.targets[0], 18);
                    subgraphPools[index].upperTarget = formatFixed(onchainData.targets[1], 18);
                }

                const wrappedIndex = subgraphPools[index].wrappedIndex;
                if (wrappedIndex === undefined || onchainData.rate === undefined) {
                    console.error(`Linear Pool Missing WrappedIndex or PriceRate: ${poolId}`);
                    return;
                }

                // Update priceRate of wrappedToken
                const tokens = subgraphPools[index].tokens;

                if (tokens && typeof wrappedIndex === 'number' && tokens[wrappedIndex]) {
                    tokens[wrappedIndex].priceRate = formatFixed(onchainData.rate, 18);
                }
            }

            subgraphPools[index].swapFee = formatFixed(swapFee, 18);
            subgraphPools[index].totalShares = formatFixed(totalSupply, 18);
            subgraphPools[index].swapEnabled =
                typeof swapEnabled !== 'undefined' ? swapEnabled : subgraphPools[index].swapEnabled;

            poolTokens.tokens.forEach((token, i) => {
                const T = (subgraphPools[index].tokens || []).find((t) => isSameAddress(t.address, token));
                if (!T) throw `Pool Missing Expected Token: ${poolId} ${token}`;
                T.balance = formatFixed(poolTokens.balances[i], T.decimals);
                if (weights) {
                    // Only expected for WeightedPools
                    T.weight = formatFixed(weights[i], 18);
                }
            });

            if (onchainData.tokenRates) {
                subgraphPools[index].tokenRates = onchainData.tokenRates?.map((rate) => formatFixed(rate, 18));
            }

            if (onchainData.linearPools) {
                subgraphPools[index].linearPools = Object.entries(onchainData.linearPools).map(([address, data]) => {
                    const linearPool = pools[data.id];
                    const mainTokenIdx = data.mainToken.index.toNumber();
                    const wrappedTokenIdx = data.wrappedToken.index.toNumber();
                    const mainTokenBalance = linearPool.poolTokens.balances[mainTokenIdx];
                    const wrappedTokenBalance = linearPool.poolTokens.balances[wrappedTokenIdx];
                    const subgraphLinearPool = subgraphPools.find((pool) => pool.id === data.id);
                    const mainPoolToken = (subgraphLinearPool?.tokens || []).find((t) =>
                        isSameAddress(t.address, linearPool.poolTokens.tokens[mainTokenIdx]),
                    );
                    const wrappedPoolToken = (subgraphLinearPool?.tokens || []).find((t) =>
                        isSameAddress(t.address, linearPool.poolTokens.tokens[wrappedTokenIdx]),
                    );

                    if (!mainPoolToken || !wrappedPoolToken) {
                        throw `Could not find linear pool tokens in the subgraph pools: ${data.id}`;
                    }

                    return {
                        id: data.id,
                        address,
                        priceRate: formatFixed(data.priceRate, 18),
                        totalSupply: formatFixed(data.totalSupply, 18),
                        unwrappedTokenAddress: data.mainToken.address,
                        mainToken: {
                            index: mainTokenIdx,
                            address: data.mainToken.address,
                            balance: formatFixed(mainTokenBalance, mainPoolToken.decimals),
                            name: mainPoolToken.name,
                            symbol: mainPoolToken.symbol,
                            decimals: mainPoolToken.decimals,
                        },
                        wrappedToken: {
                            index: wrappedTokenIdx,
                            address: data.wrappedToken.address,
                            balance: formatFixed(wrappedTokenBalance, wrappedPoolToken.decimals),
                            priceRate: formatFixed(data.wrappedToken.rate, 18),
                            name: wrappedPoolToken.name,
                            symbol: wrappedPoolToken.symbol,
                            decimals: wrappedPoolToken.decimals,
                        },
                    };
                });
            }

            onChainPools.push(subgraphPools[index]);
        } catch (err) {
            console.log(err);
            throw `Issue with pool onchain data: ${err}`;
        }
    });

    return onChainPools;
}

function isSameAddress(address1: string, address2: string): boolean {
    return getAddress(address1) === getAddress(address2);
}
