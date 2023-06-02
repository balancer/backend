import { Provider } from '@ethersproject/providers';
import ElementPoolAbi from '../abi/ConvergentCurvePool.json';
import LinearPoolAbi from '../abi/LinearPool.json';
import LiquidityBootstrappingPoolAbi from '../abi/LiquidityBootstrappingPool.json';
import { Multicaller } from '../../web3/multicaller';
import { BigNumber, Contract } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { prisma } from '../../../prisma/prisma-client';
import { isComposableStablePool, isStablePool, isWeightedPoolV2 } from './pool-utils';
import { TokenService } from '../../token/token.service';
import BalancerPoolDataQueryAbi from '../abi/BalancerPoolDataQueries.json';
import { networkContext } from '../../network/network-context.service';

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

const defaultPoolDataQueryConfig: PoolDataQueryConfig = {
    loadTokenBalanceUpdatesAfterBlock: false,
    loadTotalSupply: false,
    loadSwapFees: false,
    loadLinearWrappedTokenRates: false,
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
    targets?: string[];
    swapEnabled?: boolean;
    pausedState?: [boolean, string, string]
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

    public async updateOnChainData(poolIds: string[], provider: Provider, blockNumber: number): Promise<void> {
        if (poolIds.length === 0) return;

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
        const gyroPoolIdexes: number[] = [];
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

        const ratePoolsIndexes = [...linearPoolIdexes, ...gyroPoolIdexes];

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
                linearPoolIdxs: linearPoolIdexes,
                loadRates: ratePoolsIndexes.length > 0,
                ratePoolIdxs: ratePoolsIndexes,
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
                [...ElementPoolAbi, ...LinearPoolAbi, ...LiquidityBootstrappingPoolAbi].map((row) => [row.name, row]),
            ),
        );

        const multiPool = new Multicaller(networkContext.data.multicall, provider, abis);

        filteredPools.forEach((pool) => {
            if (!SUPPORTED_POOL_TYPES.includes(pool.type || '')) {
                console.error(`Unknown pool type: ${pool.type} ${pool.id}`);
                return;
            }

            if (pool.type === 'LINEAR') {
                multiPool.call(`${pool.id}.targets`, pool.address, 'getTargets');
            }

            if (pool.type === 'LIQUIDITY_BOOTSTRAPPING' || pool.type === 'INVESTMENT') {
                multiPool.call(`${pool.id}.swapEnabled`, pool.address, 'getSwapEnabled');
            }

            if (pool.type === 'LINEAR' || pool.type === 'META_STABLE' || pool.type === 'PHANTOM_STABLE' || pool.type === 'STABLE' || pool.type === 'WEIGHTED') {
                multiPool.call(`${pool.id}.pausedState`, pool.address, 'getPausedState');
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
                console.log(`Pool query return with error, skipping: ${poolData.id}`);
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
                    if (!multicallResult?.targets) {
                        console.error(`Linear Pool Missing Targets: ${poolId}`);
                        continue;
                    } else {
                        const lowerTarget = formatFixed(multicallResult.targets[0], 18);
                        const upperTarget = formatFixed(multicallResult.targets[1], 18);

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
                let swapEnabled: boolean | undefined;
                if(typeof multicallResult?.swapEnabled !== 'undefined')
                    swapEnabled =  multicallResult.swapEnabled;
                else if(typeof multicallResult?.pausedState !== 'undefined')
                    swapEnabled = !multicallResult.pausedState[0];
                else
                    swapEnabled = pool.dynamicData?.swapEnabled;

                if (
                    pool.dynamicData &&
                    (pool.dynamicData.swapFee !== swapFee ||
                        pool.dynamicData.totalShares !== totalShares ||
                        pool.dynamicData.swapEnabled !== swapEnabled)
                ) {
                    await prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: networkContext.chain } },
                        data: {
                            swapFee,
                            totalShares,
                            totalSharesNum: parseFloat(totalShares),
                            swapEnabled: typeof swapEnabled !== 'undefined' ? swapEnabled : true,
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
                console.log('error syncing on chain data', e);
            }
        }
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
            weights: response[4],
            scalingFactors: response[5],
            amps: response[6],
            rates: response[7],
            ignoreIdxs: response[8],
        };
    }
}
