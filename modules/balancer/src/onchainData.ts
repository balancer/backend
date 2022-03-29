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
import _ from 'lodash';

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
    wrappedTokenRate?: string;
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
    stablePhantomPools?: Record<
        string,
        {
            id: string;
            totalSupply: string;
            tokenRates: BigNumber[];
            poolTokens: {
                tokens: string[];
                balances: string[];
            };
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
    const linearPoolMap = _.keyBy(
        subgraphPoolsOriginal.filter((pool) => pool.poolType === 'Linear'),
        (pool) => pool.address.toLowerCase(),
    );
    const stablePhantomMap = _.keyBy(
        subgraphPoolsOriginal.filter((pool) => pool.poolType === 'StablePhantom'),
        (pool) => pool.address.toLowerCase(),
    );

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
            multiPool.call(`${pool.id}.rate`, pool.address, 'getRate');
            multiPool.call(`${pool.id}.wrappedTokenRate`, pool.address, 'getWrappedTokenRate');
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
            });
        }

        const tokenAddresses = (pool.tokens || []).map((token) => token.address);

        tokenAddresses.forEach((token, i) => {
            if (linearPoolMap[token.toLowerCase()]) {
                addLinearPoolCalls(multiPool, pool.id, token);
            }

            if (stablePhantomMap[token.toLowerCase()]) {
                const stablePhantomTokenAddresses = (stablePhantomMap[token.toLowerCase()].tokens || []).map(
                    (token) => token.address,
                );

                for (const stablePhantomToken of stablePhantomTokenAddresses) {
                    if (linearPoolMap[stablePhantomToken.toLowerCase()]) {
                        addLinearPoolCalls(multiPool, pool.id, stablePhantomToken.toLowerCase());
                    }
                }

                if (token.toLowerCase() !== pool.address) {
                    addStablePhantomPoolCalls(multiPool, vaultAddress, pool.id, stablePhantomMap[token.toLowerCase()]);
                }
            }
        });
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
                    console.log('onchain data', onchainData);
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
                if (wrappedIndex === undefined || onchainData.wrappedTokenRate === undefined) {
                    console.error(`Linear Pool Missing WrappedIndex or PriceRate: ${poolId}`);
                    return;
                }

                // Update priceRate of wrappedToken
                const tokens = subgraphPools[index].tokens;

                if (tokens && typeof wrappedIndex === 'number' && tokens[wrappedIndex]) {
                    tokens[wrappedIndex].priceRate = formatFixed(onchainData.wrappedTokenRate, 18);
                }

                const phantomIdx = tokens.findIndex((token) => token.address === subgraphPools[index].address);

                if (phantomIdx !== -1 && onchainData.rate) {
                    tokens[phantomIdx].priceRate = formatFixed(onchainData.rate, 18);
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

            if (onchainData.stablePhantomPools) {
                subgraphPools[index].stablePhantomPools = Object.entries(onchainData.stablePhantomPools).map(
                    ([address, data]) => {
                        const stablePhantomPool = stablePhantomMap[address];
                        const poolToken = (subgraphPools[index].tokens || []).find(
                            (token) => token.address === address,
                        );

                        let balance = poolToken?.balance || '0';
                        const totalSupply = formatFixed(data.totalSupply, 18);
                        let percentOfSupply = parseFloat(balance) / parseFloat(totalSupply);

                        return {
                            id: data.id,
                            address,
                            balance,
                            symbol: stablePhantomPool.symbol,
                            totalSupply: formatFixed(data.totalSupply, 18),
                            tokens: stablePhantomPool.tokens
                                .filter((token) => token.address !== stablePhantomPool.address)
                                .map((token, index) => {
                                    const totalBalance = formatFixed(data.poolTokens.balances[index], token.decimals);

                                    return {
                                        ...token,
                                        balance: `${parseFloat(totalBalance) * percentOfSupply}`,
                                        priceRate: formatFixed(data.tokenRates[index], 18),
                                    };
                                }),
                        };
                    },
                );
            }

            if (onchainData.linearPools) {
                subgraphPools[index].mainTokens = [
                    //filter for any main tokens in the tokensList. ie: bb-yv-USD / TUSD
                    ...subgraphPools[index].tokensList.filter(
                        (token) =>
                            subgraphPools[index].poolType !== 'Linear' &&
                            !linearPoolMap[token] &&
                            !stablePhantomMap[token],
                    ),
                    //map linear pools to their main token
                    ...Object.entries(onchainData.linearPools).map(([address, data]) => data.mainToken.address),
                ];

                subgraphPools[index].linearPools = Object.entries(onchainData.linearPools).map(([address, data]) => {
                    const poolTokens = _.keyBy(subgraphPools[index].tokens, 'address');
                    const linearPool = pools[data.id];
                    const mainTokenIdx = data.mainToken.index.toNumber();
                    const wrappedTokenIdx = data.wrappedToken.index.toNumber();
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

                    const mainTokenTotalSupply = formatFixed(
                        linearPool.poolTokens.balances[mainTokenIdx],
                        mainPoolToken.decimals,
                    );
                    const wrappedTokenTotalSupply = formatFixed(
                        linearPool.poolTokens.balances[wrappedTokenIdx],
                        wrappedPoolToken.decimals,
                    );

                    let balance = poolTokens[address]?.balance || '0';
                    const totalSupply = formatFixed(data.totalSupply, 18);
                    let percentOfSupply = parseFloat(balance) / parseFloat(totalSupply);
                    let poolToken = address;

                    if (!poolTokens[address]) {
                        //the linear pool is nested in a stable phantom pool.
                        const stablePhantomToken = subgraphPools[index].tokens.find((token) => {
                            return subgraphPools[index].address !== token.address && stablePhantomMap[token.address];
                        });
                        const phantomOnChainData = _.find(pools, (pool, id) =>
                            id.startsWith(stablePhantomToken?.address || ''),
                        );

                        const virtualSupply = formatFixed(phantomOnChainData?.totalSupply || '0', 18);

                        percentOfSupply = parseFloat(stablePhantomToken?.balance || '0') / parseFloat(virtualSupply);

                        poolToken = stablePhantomToken?.address || '';
                        balance = `${parseFloat(totalSupply) * percentOfSupply}`;
                    }

                    const mainTokenBalance = parseFloat(mainTokenTotalSupply) * percentOfSupply;
                    const wrappedTokenBalance = parseFloat(wrappedTokenTotalSupply) * percentOfSupply;
                    const wrappedTokenPriceRate = formatFixed(data.wrappedToken.rate, 18);
                    const mainTokenTotalBalance =
                        mainTokenBalance + wrappedTokenBalance * parseFloat(wrappedTokenPriceRate);

                    return {
                        id: data.id,
                        address,
                        symbol: subgraphLinearPool?.symbol || '',
                        priceRate: formatFixed(data.priceRate, 18),
                        balance,
                        mainTokenTotalBalance: `${mainTokenTotalBalance}`,
                        totalSupply,
                        unwrappedTokenAddress: data.mainToken.address,
                        mainToken: {
                            index: mainTokenIdx,
                            address: data.mainToken.address,
                            balance: `${mainTokenBalance}`,
                            totalSupply: mainTokenTotalSupply,
                            name: mainPoolToken.name,
                            symbol: mainPoolToken.symbol,
                            decimals: mainPoolToken.decimals,
                        },
                        wrappedToken: {
                            index: wrappedTokenIdx,
                            address: data.wrappedToken.address,
                            balance: `${wrappedTokenBalance}`,
                            totalSupply: wrappedTokenTotalSupply,
                            priceRate: wrappedTokenPriceRate,
                            name: wrappedPoolToken.name,
                            symbol: wrappedPoolToken.symbol,
                            decimals: wrappedPoolToken.decimals,
                        },
                        poolToken,
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

function addLinearPoolCalls(multiPool: Multicaller, poolId: string, token: string) {
    multiPool.call(`${poolId}.linearPools.${token}.id`, token, 'getPoolId');
    multiPool.call(`${poolId}.linearPools.${token}.priceRate`, token, 'getRate');
    multiPool.call(`${poolId}.linearPools.${token}.totalSupply`, token, 'getVirtualSupply');
    multiPool.call(`${poolId}.linearPools.${token}.mainToken.address`, token, 'getMainToken');
    multiPool.call(`${poolId}.linearPools.${token}.mainToken.index`, token, 'getMainIndex');
    multiPool.call(`${poolId}.linearPools.${token}.wrappedToken.address`, token, 'getWrappedToken');
    multiPool.call(`${poolId}.linearPools.${token}.wrappedToken.index`, token, 'getWrappedIndex');
    multiPool.call(`${poolId}.linearPools.${token}.wrappedToken.rate`, token, 'getWrappedTokenRate');
}

function addStablePhantomPoolCalls(
    multiPool: Multicaller,
    vaultAddress: string,
    poolId: string,
    stablePhantomPool: GqlBalancerPool,
) {
    multiPool.call(
        `${poolId}.stablePhantomPools.${stablePhantomPool.address}.id`,
        stablePhantomPool.address,
        'getPoolId',
    );
    multiPool.call(
        `${poolId}.stablePhantomPools.${stablePhantomPool.address}.totalSupply`,
        stablePhantomPool.address,
        'getVirtualSupply',
    );

    multiPool.call(
        `${poolId}.stablePhantomPools.${stablePhantomPool.address}.poolTokens`,
        vaultAddress,
        'getPoolTokens',
        [stablePhantomPool.id],
    );

    const tokenAddresses = (stablePhantomPool.tokens || []).map((token) => token.address);

    tokenAddresses.forEach((token, i) => {
        multiPool.call(
            `${poolId}.stablePhantomPools.${stablePhantomPool.address}.tokenRates[${i}]`,
            stablePhantomPool.address,
            'getTokenRate',
            [token],
        );
    });
}
