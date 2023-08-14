import ElementPoolAbi from '../abi/ConvergentCurvePool.json';
import LinearPoolAbi from '../abi/LinearPool.json';
import LiquidityBootstrappingPoolAbi from '../abi/LiquidityBootstrappingPool.json';
import ComposableStablePoolAbi from '../abi/ComposableStablePool.json';
import GyroEV2Abi from '../abi/GyroEV2.json';
import VaultAbi from '../abi/Vault.json';
import aTokenRateProvider from '../abi/StaticATokenRateProvider.json';
import WeightedPoolAbi from '../abi/WeightedPool.json';
import StablePoolAbi from '../abi/StablePool.json';
import MetaStablePool from '../abi/MetaStablePool.json';
import StablePhantomPoolAbi from '../abi/StablePhantomPool.json';
import { BigNumber, Contract } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { prisma } from '../../../prisma/prisma-client';
import { isComposableStablePool, isGyroEV2, isStablePool, isWeightedPoolV2 } from './pool-utils';
import { TokenService } from '../../token/token.service';
import BalancerPoolDataQueryAbi from '../abi/BalancerPoolDataQueries.json';
import { networkContext } from '../../network/network-context.service';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { Multicaller3 } from '../../web3/multicaller3';

// enum PoolQueriesTotalSupplyType {
//     TOTAL_SUPPLY = 0,
//     VIRTUAL_SUPPLY,
//     ACTUAL_SUPPLY,
// }

// enum PoolQuerySwapFeeType {
//     SWAP_FEE_PERCENTAGE = 0,
//     PERCENT_FEE,
// }

// interface PoolDataQueryConfig {
//     loadTokenBalanceUpdatesAfterBlock: boolean;
//     loadTotalSupply: boolean;
//     loadSwapFees: boolean;
//     loadLinearWrappedTokenRates: boolean;
//     loadLinearTargets: boolean;
//     loadNormalizedWeights: boolean;
//     loadScalingFactors: boolean;
//     loadAmps: boolean;
//     loadRates: boolean;
//     blockNumber: number;
//     totalSupplyTypes: PoolQueriesTotalSupplyType[];
//     swapFeeTypes: PoolQuerySwapFeeType[];
//     linearPoolIdxs: number[];
//     weightedPoolIdxs: number[];
//     scalingFactorPoolIdxs: number[];
//     ampPoolIdxs: number[];
//     ratePoolIdxs: number[];
// }

interface PoolStatusResult {
    [key: string]: {
        isPaused: boolean;
        inRecoveryMode: boolean;
    };
}

// const defaultPoolDataQueryConfig: PoolDataQueryConfig = {
//     loadTokenBalanceUpdatesAfterBlock: false,
//     loadTotalSupply: false,
//     loadSwapFees: false,
//     loadLinearWrappedTokenRates: false,
//     loadLinearTargets: false,
//     loadNormalizedWeights: false,
//     loadScalingFactors: false,
//     loadAmps: false,
//     loadRates: false,
//     blockNumber: 0,
//     totalSupplyTypes: [],
//     swapFeeTypes: [],
//     linearPoolIdxs: [],
//     weightedPoolIdxs: [],
//     scalingFactorPoolIdxs: [],
//     ampPoolIdxs: [],
//     ratePoolIdxs: [],
// };

interface MulticallPoolStateExecuteResult {
    inRecoveryMode: boolean;
    pausedState: {
        paused: boolean;
    };
}
interface MulticallExecuteResult {
    amp?: string[] | undefined;
    swapFee: string | undefined;
    totalSupply: string | undefined;
    weights?: string[] | undefined;
    targets?: string[] | undefined;
    poolTokens: {
        tokens: string[];
        balances: string[];
    };
    wrappedTokenRate?: BigNumber | undefined;
    rate?: BigNumber | undefined;
    swapEnabled?: boolean | undefined;
    protocolFeePercentageCache?: number | undefined;
    tokenRates?: BigNumber[] | undefined;
    metaPriceRateCache?: [BigNumber, BigNumber, BigNumber][] | undefined;
}

const SUPPORTED_POOL_TYPES: PrismaPoolType[] = [
    'WEIGHTED',
    'STABLE',
    'META_STABLE',
    'PHANTOM_STABLE',
    'LINEAR',
    'LIQUIDITY_BOOTSTRAPPING',
    'ELEMENT',
    'GYRO',
    'GYRO3',
    'GYROE',
];

// export interface poolIdWithType {
//     id: string;
//     type: PrismaPoolType;
// }

export class PoolOnChainDataService {
    constructor(private readonly tokenService: TokenService) {}

    public async updateOnChainStatus(poolIds: string[]): Promise<void> {
        if (poolIds.length === 0) return;

        const filteredPools = await prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
                chain: networkContext.chain,
                type: { in: SUPPORTED_POOL_TYPES },
            },
        });

        const poolAddressFromDb = filteredPools.map((pool) => pool.address);

        const poolStatusResults = await this.queryPoolStatus(poolAddressFromDb);

        const operations = [];

        for (const poolId of poolAddressFromDb) {
            if (poolStatusResults[poolId]) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: poolId, chain: networkContext.chain } },
                        data: {
                            isPaused: poolStatusResults[poolId].isPaused,
                            isInRecoveryMode: poolStatusResults[poolId].inRecoveryMode,
                        },
                    }),
                );
            }
        }
        prismaBulkExecuteOperations(operations, false);
    }

    public async updateOnChainData(poolIds: string[], blockNumber: number): Promise<void> {
        if (poolIds.length === 0) {
            return;
        }

        const filteredPools = await prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
                chain: networkContext.chain,
                type: { in: SUPPORTED_POOL_TYPES },
            },
            include: {
                tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true, token: true } },
                stableDynamicData: true,
                dynamicData: true,
                linearDynamicData: true,
                linearData: true,
            },
        });

        const tokenPrices = await this.tokenService.getTokenPrices();

        const abis: any = Object.values(
            // Remove duplicate entries using their names
            Object.fromEntries(
                [
                    ...ElementPoolAbi,
                    ...LinearPoolAbi,
                    ...LiquidityBootstrappingPoolAbi,
                    ...ComposableStablePoolAbi,
                    ...GyroEV2Abi,
                    ...VaultAbi,
                    ...aTokenRateProvider,
                    ...WeightedPoolAbi,
                    ...StablePoolAbi,
                    ...StablePhantomPoolAbi,
                    ...MetaStablePool,
                    ...ComposableStablePoolAbi,
                    //...WeightedPoolV2Abi,
                ].map((row) => [row.name, row]),
            ),
        );

        const multiPool = new Multicaller3(networkContext.data.multicall3, abis);

        filteredPools.forEach((pool) => {
            if (!SUPPORTED_POOL_TYPES.includes(pool.type || '')) {
                console.error(`Unknown pool type: ${pool.type} ${pool.id}`);
                return;
            }

            // get per pool yield protocol fee (type 2)
            if (
                networkContext.data.balancer.factoriesWithpoolSpecificProtocolFeePercentagesProvider?.includes(
                    pool.factory || '',
                )
            ) {
                multiPool.call(
                    `${pool.id}.protocolYieldFeePercentageCache`,
                    pool.address,
                    'getProtocolFeePercentageCache',
                    [2],
                );
            }

            multiPool.call(
                `${pool.id}.poolTokens`,
                networkContext.data.balancer.vault,
                'getPoolTokens',
                [pool.id],
                false,
            );

            if (pool.type === 'WEIGHTED' || pool.type === 'LIQUIDITY_BOOTSTRAPPING' || pool.type === 'INVESTMENT') {
                multiPool.call(`${pool.id}.weights`, pool.address, 'getNormalizedWeights');
                multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFeePercentage');
            } else if (isStablePool(pool.type)) {
                // MetaStable & StablePhantom is the same as Stable for multicall purposes
                multiPool.call(`${pool.id}.amp`, pool.address, 'getAmplificationParameter');
                multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFeePercentage');
            } else if (pool.type === 'ELEMENT') {
                multiPool.call(`${pool.id}.swapFee`, pool.address, 'percentFee');
            } else if (pool.type === 'LINEAR') {
                multiPool.call(`${pool.id}.swapFee`, pool.address, 'getSwapFeePercentage');
                multiPool.call(`${pool.id}.targets`, pool.address, 'getTargets');
                multiPool.call(`${pool.id}.rate`, pool.address, 'getRate');
                multiPool.call(`${pool.id}.wrappedTokenRate`, pool.address, 'getWrappedTokenRate');
            }

            if (pool.type === 'LIQUIDITY_BOOTSTRAPPING' || pool.type === 'INVESTMENT') {
                multiPool.call(`${pool.id}.swapEnabled`, pool.address, 'getSwapEnabled');
            }

            if (pool.type === 'META_STABLE') {
                const tokenAddresses = pool.tokens.map((token) => token.address);

                tokenAddresses.forEach((token, i) => {
                    multiPool.call(`${pool.id}.metaPriceRateCache[${i}]`, pool.address, 'getPriceRateCache', [token]);
                });
            }

            if (isComposableStablePool(pool) || isWeightedPoolV2(pool)) {
                multiPool.call(`${pool.id}.totalSupply`, pool.address, 'getActualSupply');
            } else if (pool.type === 'LINEAR' || pool.type === 'PHANTOM_STABLE') {
                // the old phantom stable and linear pool does not have this and expose the actual supply as virtualSupply
                multiPool.call(`${pool.id}.totalSupply`, pool.address, 'getVirtualSupply');
            } else {
                //default to totalSupply for any other pool type
                multiPool.call(`${pool.id}.totalSupply`, pool.address, 'totalSupply');
            }

            if (pool.type === 'PHANTOM_STABLE') {
                //we retrieve token rates for phantom stable and composable stable pools
                const tokenAddresses = pool.tokens.map((token) => token.address);

                tokenAddresses.forEach((token, i) => {
                    multiPool.call(`${pool.id}.tokenRates[${i}]`, pool.address, 'getTokenRate', [token]);
                });
            }

            // gyro pool returns uint[] for rates
            if (isGyroEV2(pool)) {
                multiPool.call(`${pool.id}.tokenRates`, pool.address, 'getTokenRates');
            }
        });

        let poolsOnChainData = {} as Record<string, MulticallExecuteResult>;

        try {
            poolsOnChainData = (await multiPool.execute()) as Record<string, MulticallExecuteResult>;
        } catch (err: any) {
            console.error(err);
            throw `Issue with multicall execution. ${err}`;
        }

        const poolsOnChainDataArray = Object.entries(poolsOnChainData);

        for (let index = 0; index < poolsOnChainDataArray.length; index++) {
            const [poolId, onchainData] = poolsOnChainDataArray[index];
            const pool = filteredPools.find((pool) => pool.id === poolId)!;
            const { poolTokens } = onchainData;

            try {
                if (isStablePool(pool.type)) {
                    if (!onchainData.amp) {
                        console.log('onchain data', onchainData);
                        console.error(`Stable Pool Missing Amp: ${poolId}`);
                        continue;
                    }

                    // Need to scale amp by precision to match expected Subgraph scale
                    // amp is stored with 3 decimals of precision
                    const amp = formatFixed(onchainData.amp[0], 3);

                    //only update if amp has changed
                    if (!pool.stableDynamicData || pool.stableDynamicData.amp !== amp) {
                        await prisma.prismaPoolStableDynamicData.upsert({
                            where: { id_chain: { id: pool.id, chain: networkContext.chain } },
                            create: { id: pool.id, chain: networkContext.chain, poolId: pool.id, amp, blockNumber },
                            update: { amp, blockNumber },
                        });
                    }
                }

                if (pool.type === 'LINEAR') {
                    if (!onchainData.targets) {
                        console.error(`Linear Pool Missing Targets: ${poolId}`);
                        continue;
                    } else {
                        const lowerTarget = formatFixed(onchainData.targets[0], 18);
                        const upperTarget = formatFixed(onchainData.targets[1], 18);

                        if (
                            !pool.linearDynamicData ||
                            pool.linearDynamicData.lowerTarget !== lowerTarget ||
                            pool.linearDynamicData.upperTarget !== upperTarget
                        ) {
                            await prisma.prismaPoolLinearDynamicData.upsert({
                                where: { id_chain: { id: pool.id, chain: networkContext.chain } },
                                create: {
                                    id: pool.id,
                                    chain: networkContext.chain,
                                    poolId: pool.id,
                                    upperTarget,
                                    lowerTarget,
                                    blockNumber,
                                },
                                update: { upperTarget, lowerTarget, blockNumber },
                            });
                        }
                    }
                }

                const swapFee = formatFixed(onchainData.swapFee || '0', 18);
                const totalShares = formatFixed(onchainData.totalSupply || '0', 18);
                const swapEnabled =
                    typeof onchainData.swapEnabled !== 'undefined'
                        ? onchainData.swapEnabled
                        : pool.dynamicData?.swapEnabled;

                const yieldProtocolFeePercentage =
                    typeof onchainData.protocolFeePercentageCache !== 'undefined'
                        ? formatFixed(onchainData.protocolFeePercentageCache, 18)
                        : `${networkContext.data.balancer.yieldProtocolFeePercentage}`;

                if (
                    pool.dynamicData &&
                    (pool.dynamicData.swapFee !== swapFee ||
                        pool.dynamicData.totalShares !== totalShares ||
                        pool.dynamicData.swapEnabled !== swapEnabled ||
                        pool.dynamicData.protocolYieldFee !== yieldProtocolFeePercentage)
                ) {
                    await prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: networkContext.chain } },
                        data: {
                            swapFee,
                            totalShares,
                            totalSharesNum: parseFloat(totalShares),
                            swapEnabled: typeof swapEnabled !== 'undefined' ? swapEnabled : true,
                            protocolYieldFee: yieldProtocolFeePercentage,
                            blockNumber,
                        },
                    });
                }

                for (let i = 0; i < poolTokens.tokens.length; i++) {
                    const tokenAddress = poolTokens.tokens[i];
                    const poolToken = pool.tokens.find((token) => isSameAddress(token.address, tokenAddress));

                    if (!poolToken) {
                        throw `Pool Missing Expected Token: ${poolId} ${tokenAddress}`;
                    }

                    if (poolToken.index !== i) {
                        throw `Pooltoken index mismatch! "poolToken.index": ${poolToken.index} vs "i":${i}`;
                    }

                    const balance = formatFixed(poolTokens.balances[i], poolToken.token.decimals);
                    const weight = onchainData.weights ? formatFixed(onchainData.weights[i], 18) : null;

                    // set token price rate for various rate types

                    // top level token rates, e.g. LSTs in pools
                    let priceRate = onchainData.tokenRates ? formatFixed(onchainData.tokenRates[i], 18) : '1.0';

                    // metastable pools
                    if (onchainData.metaPriceRateCache && onchainData.metaPriceRateCache[i][0].gt('0')) {
                        priceRate = formatFixed(onchainData.metaPriceRateCache[i][0], 18);
                    }

                    // bpt price rate
                    if (onchainData.rate && isSameAddress(poolToken.address, pool.address)) {
                        priceRate = formatFixed(onchainData.rate, 18);
                    }

                    // linear wrapped token rate
                    if (onchainData.wrappedTokenRate && pool.linearData?.wrappedIndex === poolToken.index) {
                        priceRate = formatFixed(onchainData.wrappedTokenRate, 18);
                    }

                    if (
                        !poolToken.dynamicData ||
                        poolToken.dynamicData.balance !== balance ||
                        poolToken.dynamicData.priceRate !== priceRate ||
                        poolToken.dynamicData.weight !== weight
                    ) {
                        await prisma.prismaPoolTokenDynamicData.upsert({
                            where: { id_chain: { id: poolToken.id, chain: networkContext.chain } },
                            create: {
                                id: poolToken.id,
                                chain: networkContext.chain,
                                poolTokenId: poolToken.id,
                                blockNumber,
                                priceRate,
                                weight,
                                balance,
                                balanceUSD:
                                    poolToken.address === pool.address
                                        ? 0
                                        : this.tokenService.getPriceForToken(tokenPrices, poolToken.address) *
                                          parseFloat(balance),
                            },
                            update: {
                                blockNumber,
                                priceRate,
                                weight,
                                balance,
                                balanceUSD:
                                    poolToken.address === pool.address
                                        ? 0
                                        : this.tokenService.getPriceForToken(tokenPrices, poolToken.address) *
                                          parseFloat(balance),
                            },
                        });
                    }
                }
            } catch (e) {
                console.log('error syncing on chain data', e);
            }
        }

        // const poolsOnChainDataArray = Object.entries(poolsOnChainData);

        // for (const poolData of poolDataPerPool) {
        //     if (poolData.ignored) {
        //         failed.push(poolData.id);
        //         continue;
        //     }
        //     const poolId = poolData.id;
        //     const pool = filteredPools.find((pool) => pool.id === poolId)!;
        //     let multicallResult;
        //     for (const [id, data] of poolsOnChainDataArray) {
        //         if (id === poolId) {
        //             multicallResult = data;
        //         }
        //     }

        //     try {
        //         if (isStablePool(pool.type)) {
        //             if (!poolData.amp) {
        //                 console.error(`Stable Pool Missing Amp: ${poolId}`);
        //                 continue;
        //             }

        //             // Need to scale amp by precision to match expected Subgraph scale
        //             // amp is stored with 3 decimals of precision
        //             const amp = formatFixed(poolData.amp, 3);

        //             //only update if amp has changed
        //             if (!pool.stableDynamicData || pool.stableDynamicData.amp !== amp) {
        //                 await prisma.prismaPoolStableDynamicData.upsert({
        //                     where: { id_chain: { id: pool.id, chain: networkContext.chain } },
        //                     create: { id: pool.id, chain: networkContext.chain, poolId: pool.id, amp, blockNumber },
        //                     update: { amp, blockNumber },
        //                 });
        //             }
        //         }

        //         if (pool.type === 'LINEAR') {
        //             if (!poolData.linearTargets) {
        //                 console.error(`Linear Pool Missing Targets: ${poolId}`);
        //                 continue;
        //             } else {
        //                 const lowerTarget = formatFixed(poolData.linearTargets[0], 18);
        //                 const upperTarget = formatFixed(poolData.linearTargets[1], 18);

        //                 if (
        //                     !pool.linearDynamicData ||
        //                     pool.linearDynamicData.lowerTarget !== lowerTarget ||
        //                     pool.linearDynamicData.upperTarget !== upperTarget
        //                 ) {
        //                     await prisma.prismaPoolLinearDynamicData.upsert({
        //                         where: { id_chain: { id: pool.id, chain: networkContext.chain } },
        //                         create: {
        //                             id: pool.id,
        //                             chain: networkContext.chain,
        //                             poolId: pool.id,
        //                             upperTarget,
        //                             lowerTarget,
        //                             blockNumber,
        //                         },
        //                         update: { upperTarget, lowerTarget, blockNumber },
        //                     });
        //                 }
        //             }
        //         }

        //         const swapFee = formatFixed(poolData.swapFee, 18);
        //         const totalShares = formatFixed(poolData.totalSupply, 18);
        //         const swapEnabled =
        //             typeof multicallResult?.swapEnabled !== 'undefined'
        //                 ? multicallResult.swapEnabled
        //                 : pool.dynamicData?.swapEnabled;

        //         const yieldProtocolFeePercentage =
        //             typeof multicallResult?.protocolFeePercentageCache !== 'undefined'
        //                 ? formatFixed(multicallResult.protocolFeePercentageCache, 18)
        //                 : `${networkContext.data.balancer.yieldProtocolFeePercentage}`;

        //         if (
        //             pool.dynamicData &&
        //             (pool.dynamicData.swapFee !== swapFee ||
        //                 pool.dynamicData.totalShares !== totalShares ||
        //                 pool.dynamicData.swapEnabled !== swapEnabled ||
        //                 pool.dynamicData.protocolYieldFee !== yieldProtocolFeePercentage)
        //         ) {
        //             await prisma.prismaPoolDynamicData.update({
        //                 where: { id_chain: { id: pool.id, chain: networkContext.chain } },
        //                 data: {
        //                     swapFee,
        //                     totalShares,
        //                     totalSharesNum: parseFloat(totalShares),
        //                     swapEnabled: typeof swapEnabled !== 'undefined' ? swapEnabled : true,
        //                     protocolYieldFee: yieldProtocolFeePercentage,
        //                     blockNumber,
        //                 },
        //             });
        //         }

        //         for (const poolToken of pool.tokens) {
        //             const balance = formatFixed(poolData.balances[poolToken.index] || '0', poolToken.token.decimals);
        //             const weight = poolData.weights ? formatFixed(poolData.weights[poolToken.index], 18) : null;

        //             let priceRate = '1.0';

        //             // set token rate from scaling factors
        //             if (poolData.scalingFactors && poolData.scalingFactors[poolToken.index]) {
        //                 priceRate = formatFixed(
        //                     poolData.scalingFactors[poolToken.index]
        //                         .mul(BigNumber.from('10').pow(poolToken.token.decimals))
        //                         .div(`1000000000000000000`),
        //                     18,
        //                 );
        //             }

        //             // set GyroE V2 token rates using multicall values
        //             if (isGyroEV2(pool) && multicallResult?.tokenRates !== undefined) {
        //                 priceRate = formatFixed(multicallResult?.tokenRates[poolToken.index], 18);
        //             }

        //             // override the rate of the phantom bpt with pool.getRate if present
        //             if (poolData.rate && isSameAddress(poolToken.address, pool.address)) {
        //                 priceRate = formatFixed(poolData.rate, 18);
        //             }

        //             // override the rate of the wrapped token with pool.getWrappedTokenRate if present
        //             if (poolData.wrappedTokenRate && pool.linearData?.wrappedIndex === poolToken.index) {
        //                 priceRate = formatFixed(poolData.wrappedTokenRate, 18);
        //             }

        //             if (
        //                 !poolToken.dynamicData ||
        //                 poolToken.dynamicData.balance !== balance ||
        //                 poolToken.dynamicData.priceRate !== priceRate ||
        //                 poolToken.dynamicData.weight !== weight
        //             ) {
        //                 await prisma.prismaPoolTokenDynamicData.upsert({
        //                     where: { id_chain: { id: poolToken.id, chain: networkContext.chain } },
        //                     create: {
        //                         id: poolToken.id,
        //                         chain: networkContext.chain,
        //                         poolTokenId: poolToken.id,
        //                         blockNumber,
        //                         priceRate,
        //                         weight,
        //                         balance,
        //                         balanceUSD:
        //                             poolToken.address === pool.address
        //                                 ? 0
        //                                 : this.tokenService.getPriceForToken(tokenPrices, poolToken.address) *
        //                                   parseFloat(balance),
        //                     },
        //                     update: {
        //                         blockNumber,
        //                         priceRate,
        //                         weight,
        //                         balance,
        //                         balanceUSD:
        //                             poolToken.address === pool.address
        //                                 ? 0
        //                                 : this.tokenService.getPriceForToken(tokenPrices, poolToken.address) *
        //                                   parseFloat(balance),
        //                     },
        //                 });
        //             }
        //         }
        //     } catch (e) {
        //         failed.push(poolData.id);
        //         console.log('error syncing on chain data', e);
        // //     }
        //     success.push(poolData.id);

        //     // console.log(
        //     //     `Successful updates: ${success.length}, failed updates: ${failed.length}. Failed pool Ids: ${failed}`,
        //     // );
        // }
        // return { failed, success };
    }

    // public async queryPoolData({
    //     poolIds,
    //     config,
    // }: {
    //     poolIds: string[];
    //     config: Partial<PoolDataQueryConfig>;
    // }): Promise<{
    //     balances: BigNumber[][];
    //     totalSupplies: BigNumber[];
    //     swapFees: BigNumber[];
    //     linearWrappedTokenRates: BigNumber[];
    //     linearTargets: BigNumber[][];
    //     weights: BigNumber[][];
    //     scalingFactors: BigNumber[][];
    //     amps: BigNumber[];
    //     rates: BigNumber[];
    //     ignoreIdxs: BigNumber[];
    // }> {
    //     const contract = new Contract(
    //         networkContext.data.balancer.poolDataQueryContract,
    //         BalancerPoolDataQueryAbi,
    //         networkContext.provider,
    //     );

    //     const response = await contract.getPoolData(poolIds, {
    //         ...defaultPoolDataQueryConfig,
    //         ...config,
    //     });

    //     return {
    //         balances: response[0],
    //         totalSupplies: response[1],
    //         swapFees: response[2],
    //         linearWrappedTokenRates: response[3],
    //         linearTargets: response[4],
    //         weights: response[5],
    //         scalingFactors: response[6],
    //         amps: response[7],
    //         rates: response[8],
    //         ignoreIdxs: response[9],
    //     };
    // }

    public async queryPoolStatus(poolAddresses: string[]): Promise<PoolStatusResult> {
        const multicall = new Multicaller3(ComposableStablePoolAbi);

        poolAddresses.forEach((address) => {
            multicall.call(`${address}.inRecoveryMode`, address, 'inRecoveryMode');
            multicall.call(`${address}.pausedState`, address, 'getPausedState');
        });

        const poolStateResult = (await multicall.execute()) as Record<string, MulticallPoolStateExecuteResult>;

        const result: PoolStatusResult = {};

        for (const poolAddress in poolStateResult) {
            result[poolAddress] = {
                inRecoveryMode: poolStateResult[poolAddress].inRecoveryMode
                    ? poolStateResult[poolAddress].inRecoveryMode
                    : false,
                isPaused: poolStateResult[poolAddress].pausedState
                    ? poolStateResult[poolAddress].pausedState.paused
                    : false,
            };
        }

        return result;
    }
}
