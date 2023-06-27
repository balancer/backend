import { Provider } from '@ethersproject/providers';
import ElementPoolAbi from '../abi/ConvergentCurvePool.json';
import LinearPoolAbi from '../abi/LinearPool.json';
import LiquidityBootstrappingPoolAbi from '../abi/LiquidityBootstrappingPool.json';
import ComposableStablePoolAbi from '../abi/ComposableStablePool.json';
import GyroEV2Abi from '../abi/GyroEV2.json';
import { Multicaller } from '../../web3/multicaller';
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

enum PoolQueriesTotalSupplyType {
    TOTAL_SUPPLY = 0,
    VIRTUAL_SUPPLY,
    ACTUAL_SUPPLY,
}

enum PoolQuerySwapFeeType {
    SWAP_FEE_PERCENTAGE = 0,
    PERCENT_FEE,
}

interface PoolDataQueryConfig {
    loadTokenBalanceUpdatesAfterBlock: boolean;
    loadTotalSupply: boolean;
    loadSwapFees: boolean;
    loadLinearWrappedTokenRates: boolean;
    loadLinearTargets: boolean;
    loadNormalizedWeights: boolean;
    loadScalingFactors: boolean;
    loadAmps: boolean;
    loadRates: boolean;
    blockNumber: number;
    totalSupplyTypes: PoolQueriesTotalSupplyType[];
    swapFeeTypes: PoolQuerySwapFeeType[];
    linearPoolIdxs: number[];
    weightedPoolIdxs: number[];
    scalingFactorPoolIdxs: number[];
    ampPoolIdxs: number[];
    ratePoolIdxs: number[];
}

interface PoolStatusResult {
    [key: string]: {
        isPaused: boolean;
        inRecoveryMode: boolean;
    };
}

const defaultPoolDataQueryConfig: PoolDataQueryConfig = {
    loadTokenBalanceUpdatesAfterBlock: false,
    loadTotalSupply: false,
    loadSwapFees: false,
    loadLinearWrappedTokenRates: false,
    loadLinearTargets: false,
    loadNormalizedWeights: false,
    loadScalingFactors: false,
    loadAmps: false,
    loadRates: false,
    blockNumber: 0,
    totalSupplyTypes: [],
    swapFeeTypes: [],
    linearPoolIdxs: [],
    weightedPoolIdxs: [],
    scalingFactorPoolIdxs: [],
    ampPoolIdxs: [],
    ratePoolIdxs: [],
};

interface MulticallExecuteResult {
    swapEnabled?: boolean;
    protocolFeePercentageCache?: number;
    tokenRates?: string[];
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

export interface poolIdWithType {
    id: string;
    type: PrismaPoolType;
}

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

        const poolIdsFromDb = filteredPools.map((pool) => pool.id);

        const poolStatusResults = await this.queryPoolStatus(poolIdsFromDb);

        const operations = [];

        for (const poolId of poolIdsFromDb) {
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

    public async updateOnChainData(
        poolIds: string[],
        provider: Provider,
        blockNumber: number,
    ): Promise<{ failed: string[]; success: string[] }> {
        const success: string[] = [];
        const failed: string[] = [];

        if (poolIds.length === 0) {
            return { failed, success };
        }

        poolIds = poolIds.filter(
            (poolId) => !networkContext.data.balancer.excludedPoolDataQueryPoolIds?.includes(poolId),
        );

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

        const poolIdsFromDb = filteredPools.map((pool) => pool.id);

        const weightedPoolIndexes: number[] = [];
        const linearPoolIdexes: number[] = [];
        const stablePoolIdexes: number[] = [];
        const ratePoolIdexes: number[] = [];
        const scalingFactorPoolIndexes: number[] = [];
        for (const pool of filteredPools) {
            if (pool.type === 'WEIGHTED' || pool.type === 'LIQUIDITY_BOOTSTRAPPING' || pool.type === 'INVESTMENT') {
                weightedPoolIndexes.push(poolIdsFromDb.findIndex((orderedPoolId) => orderedPoolId === pool.id));
            }
            if (pool.type === 'LINEAR') {
                linearPoolIdexes.push(poolIdsFromDb.findIndex((orderedPoolId) => orderedPoolId === pool.id));
            }
            if (isStablePool(pool.type)) {
                stablePoolIdexes.push(poolIdsFromDb.findIndex((orderedPoolId) => orderedPoolId === pool.id));
            }
            if (pool.type === 'LINEAR' || isComposableStablePool(pool) || pool.type.includes('GYRO')) {
                ratePoolIdexes.push(poolIdsFromDb.findIndex((orderedPoolId) => orderedPoolId === pool.id));
            }
            if (pool.type === 'LINEAR' || isComposableStablePool(pool) || pool.type === 'META_STABLE') {
                scalingFactorPoolIndexes.push(poolIdsFromDb.findIndex((orderedPoolId) => orderedPoolId === pool.id));
            }
        }

        const queryPoolDataResult = await this.queryPoolData({
            poolIds: poolIdsFromDb,
            config: {
                loadTokenBalanceUpdatesAfterBlock: true,
                blockNumber: 0, // always get balances from all pools
                loadAmps: stablePoolIdexes.length > 0,
                ampPoolIdxs: stablePoolIdexes,
                loadSwapFees: true,
                swapFeeTypes: filteredPools.map((pool) => {
                    if (
                        pool.type === 'WEIGHTED' ||
                        pool.type === 'LIQUIDITY_BOOTSTRAPPING' ||
                        pool.type === 'INVESTMENT' ||
                        pool.type === 'LINEAR' ||
                        // MetaStable & StablePhantom is the same as Stable for swapfee purposes
                        isStablePool(pool.type) ||
                        pool.type.includes('GYRO')
                    ) {
                        return PoolQuerySwapFeeType.SWAP_FEE_PERCENTAGE;
                    } else {
                        return PoolQuerySwapFeeType.PERCENT_FEE;
                    }
                }),
                loadTotalSupply: true,
                totalSupplyTypes: filteredPools.map((pool) => {
                    if (isComposableStablePool(pool) || isWeightedPoolV2(pool)) {
                        return PoolQueriesTotalSupplyType.ACTUAL_SUPPLY;
                    } else if (pool.type === 'LINEAR' || pool.type === 'PHANTOM_STABLE') {
                        return PoolQueriesTotalSupplyType.VIRTUAL_SUPPLY;
                    } else {
                        return PoolQueriesTotalSupplyType.TOTAL_SUPPLY;
                    }
                }),
                loadNormalizedWeights: weightedPoolIndexes.length > 0,
                weightedPoolIdxs: weightedPoolIndexes,
                loadLinearWrappedTokenRates: linearPoolIdexes.length > 0,
                loadLinearTargets: linearPoolIdexes.length > 0,
                linearPoolIdxs: linearPoolIdexes,
                loadRates: ratePoolIdexes.length > 0,
                ratePoolIdxs: ratePoolIdexes,
                loadScalingFactors: scalingFactorPoolIndexes.length > 0,
                scalingFactorPoolIdxs: scalingFactorPoolIndexes,
            },
        });

        const poolDataPerPool = poolIdsFromDb.map((poolId, i) => ({
            id: poolIdsFromDb[i],
            balances: queryPoolDataResult.balances[i],
            totalSupply: queryPoolDataResult.totalSupplies[i],
            weights: weightedPoolIndexes.includes(i)
                ? queryPoolDataResult.weights[weightedPoolIndexes.indexOf(i)]
                : undefined,
            amp: stablePoolIdexes.includes(i) ? queryPoolDataResult.amps[stablePoolIdexes.indexOf(i)] : undefined,
            wrappedTokenRate: linearPoolIdexes.includes(i)
                ? queryPoolDataResult.linearWrappedTokenRates[linearPoolIdexes.indexOf(i)]
                : undefined,
            linearTargets: linearPoolIdexes.includes(i)
                ? queryPoolDataResult.linearTargets[linearPoolIdexes.indexOf(i)]
                : undefined,
            swapFee: queryPoolDataResult.swapFees[i],
            rate: linearPoolIdexes.includes(i) ? queryPoolDataResult.rates[linearPoolIdexes.indexOf(i)] : undefined,
            scalingFactors: scalingFactorPoolIndexes.includes(i)
                ? queryPoolDataResult.scalingFactors[scalingFactorPoolIndexes.indexOf(i)]
                : undefined,
            ignored: queryPoolDataResult.ignoreIdxs.some((index) => index.eq(i)),
        }));

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
                ].map((row) => [row.name, row]),
            ),
        );

        const multiPool = new Multicaller(networkContext.data.multicall, provider, abis);

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
                multiPool.call(`${pool.id}.protocolFeePercentageCache`, pool.address, 'getProtocolFeePercentageCache', [
                    2,
                ]);
            }

            if (pool.type === 'LIQUIDITY_BOOTSTRAPPING' || pool.type === 'INVESTMENT') {
                multiPool.call(`${pool.id}.swapEnabled`, pool.address, 'getSwapEnabled');
            }

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

        for (const poolData of poolDataPerPool) {
            if (poolData.ignored) {
                failed.push(poolData.id);
                continue;
            }
            const poolId = poolData.id;
            const pool = filteredPools.find((pool) => pool.id === poolId)!;
            let multicallResult;
            for (const [id, data] of poolsOnChainDataArray) {
                if (id === poolId) {
                    multicallResult = data;
                }
            }

            try {
                if (isStablePool(pool.type)) {
                    if (!poolData.amp) {
                        console.error(`Stable Pool Missing Amp: ${poolId}`);
                        continue;
                    }

                    // Need to scale amp by precision to match expected Subgraph scale
                    // amp is stored with 3 decimals of precision
                    const amp = formatFixed(poolData.amp, 3);

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
                    if (!poolData.linearTargets) {
                        console.error(`Linear Pool Missing Targets: ${poolId}`);
                        continue;
                    } else {
                        const lowerTarget = formatFixed(poolData.linearTargets[0], 18);
                        const upperTarget = formatFixed(poolData.linearTargets[1], 18);

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

                const swapFee = formatFixed(poolData.swapFee, 18);
                const totalShares = formatFixed(poolData.totalSupply, 18);
                const swapEnabled =
                    typeof multicallResult?.swapEnabled !== 'undefined'
                        ? multicallResult.swapEnabled
                        : pool.dynamicData?.swapEnabled;

                const yieldProtocolFeePercentage =
                    typeof multicallResult?.protocolFeePercentageCache !== 'undefined'
                        ? formatFixed(multicallResult.protocolFeePercentageCache, 18)
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

                for (const poolToken of pool.tokens) {
                    const balance = formatFixed(poolData.balances[poolToken.index], poolToken.token.decimals);
                    const weight = poolData.weights ? formatFixed(poolData.weights[poolToken.index], 18) : null;

                    let priceRate = '1.0';

                    // set token rate from scaling factors
                    if (poolData.scalingFactors && poolData.scalingFactors[poolToken.index]) {
                        priceRate = formatFixed(
                            poolData.scalingFactors[poolToken.index]
                                .mul(BigNumber.from('10').pow(poolToken.token.decimals))
                                .div(`1000000000000000000`),
                            18,
                        );
                    }

                    // set GyroE V2 token rates using multicall values
                    if (isGyroEV2(pool) && multicallResult?.tokenRates !== undefined) {
                        priceRate = formatFixed(multicallResult?.tokenRates[poolToken.index], 18);
                    }

                    // override the rate of the phantom bpt with pool.getRate if present
                    if (poolData.rate && isSameAddress(poolToken.address, pool.address)) {
                        priceRate = formatFixed(poolData.rate, 18);
                    }

                    // override the rate of the wrapped token with pool.getWrappedTokenRate if present
                    if (poolData.wrappedTokenRate && pool.linearData?.wrappedIndex === poolToken.index) {
                        priceRate = formatFixed(poolData.wrappedTokenRate, 18);
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
                failed.push(poolData.id);
                console.log('error syncing on chain data', e);
            }
            success.push(poolData.id);

            // console.log(
            //     `Successful updates: ${success.length}, failed updates: ${failed.length}. Failed pool Ids: ${failed}`,
            // );
        }
        return { failed, success };
    }

    public async queryPoolData({
        poolIds,
        config,
    }: {
        poolIds: string[];
        config: Partial<PoolDataQueryConfig>;
    }): Promise<{
        balances: BigNumber[][];
        totalSupplies: BigNumber[];
        swapFees: BigNumber[];
        linearWrappedTokenRates: BigNumber[];
        linearTargets: BigNumber[][];
        weights: BigNumber[][];
        scalingFactors: BigNumber[][];
        amps: BigNumber[];
        rates: BigNumber[];
        ignoreIdxs: BigNumber[];
    }> {
        const contract = new Contract(
            networkContext.data.balancer.poolDataQueryContract,
            BalancerPoolDataQueryAbi,
            networkContext.provider,
        );

        const response = await contract.getPoolData(poolIds, {
            ...defaultPoolDataQueryConfig,
            ...config,
        });

        return {
            balances: response[0],
            totalSupplies: response[1],
            swapFees: response[2],
            linearWrappedTokenRates: response[3],
            linearTargets: response[4],
            weights: response[5],
            scalingFactors: response[6],
            amps: response[7],
            rates: response[8],
            ignoreIdxs: response[9],
        };
    }

    public async queryPoolStatus(poolIds: string[]): Promise<PoolStatusResult> {
        const contract = new Contract(
            networkContext.data.balancer.poolDataQueryContract,
            BalancerPoolDataQueryAbi,
            networkContext.provider,
        );

        const response = await contract.getPoolStatus(poolIds, { loadInRecoveryMode: true, loadIsPaused: true });

        const result = poolIds.reduce((acc, id, i) => {
            acc[id] = {
                isPaused: response[0][i],
                inRecoveryMode: response[1][i],
            };
            return acc;
        }, {} as PoolStatusResult);

        return result;
    }
}
