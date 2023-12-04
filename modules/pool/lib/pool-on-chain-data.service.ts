import { formatFixed } from '@ethersproject/bignumber';
import { Chain, PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { prisma } from '../../../prisma/prisma-client';
import { isComposableStablePool, isStablePool } from './pool-utils';
import { TokenService } from '../../token/token.service';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { fetchOnChainPoolState } from './pool-onchain-state';
import { fetchOnChainPoolData } from './pool-onchain-data';
import { fetchOnChainGyroFees } from './pool-onchain-gyro-fee';
import { networkContext } from '../../network/network-context.service';

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
    'FX',
];

export class PoolOnChainDataService {
    constructor(private readonly tokenService: TokenService) {}

    private get options() {
        return {
            chain: networkContext.chain,
            vaultAddress: networkContext.data.balancer.vault,
            yieldProtocolFeePercentage: networkContext.data.balancer.yieldProtocolFeePercentage,
            gyroConfig: networkContext.data.gyro?.config,
            composableStableFactories: networkContext.data.balancer.composableStablePoolFactories,
        };
    }

    public async updateOnChainStatus(poolIds: string[]): Promise<void> {
        if (poolIds.length === 0) return;

        const filteredPools = await prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
                chain: this.options.chain,
                type: { in: SUPPORTED_POOL_TYPES },
            },
            include: {
                dynamicData: true,
            },
        });

        const state = await fetchOnChainPoolState(filteredPools, 1024);

        const operations = [];
        for (const pool of filteredPools) {
            if (!state[pool.id]) continue; // Some pool types are filtered out in the state fetching function

            const { isPaused, isInRecoveryMode } = state[pool.id];
            const data = pool.dynamicData;
            if (data && (data.isPaused !== isPaused || data.isInRecoveryMode !== isInRecoveryMode)) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: this.options.chain } },
                        data: {
                            isPaused,
                            isInRecoveryMode,
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
                chain: this.options.chain,
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

        const gyroPools = filteredPools.filter((pool) => pool.type.includes('GYRO'));
        const poolsWithComposableStableType = filteredPools.map((pool) => ({
            ...pool,
            type: (isComposableStablePool(pool) ? 'COMPOSABLE_STABLE' : pool.type) as
                | PrismaPoolType
                | 'COMPOSABLE_STABLE',
        }));

        const tokenPrices = await this.tokenService.getTokenPrices();
        const onchainResults = await fetchOnChainPoolData(
            poolsWithComposableStableType,
            this.options.vaultAddress,
            1024,
        );
        const gyroFees = await (this.options.gyroConfig
            ? fetchOnChainGyroFees(gyroPools, this.options.gyroConfig, 1024)
            : Promise.resolve({} as { [address: string]: string }));

        const operations = [];
        for (const pool of filteredPools) {
            const onchainData = onchainResults[pool.id];
            const { amp, poolTokens } = onchainData;

            try {
                if (isStablePool(pool.type)) {
                    if (!amp) {
                        console.error(`Stable Pool Missing Amp: ${pool.id}`);
                        continue;
                    }

                    //only update if amp has changed
                    if (!pool.stableDynamicData || pool.stableDynamicData.amp !== amp) {
                        operations.push(
                            prisma.prismaPoolStableDynamicData.upsert({
                                where: { id_chain: { id: pool.id, chain: this.options.chain } },
                                create: { id: pool.id, chain: this.options.chain, poolId: pool.id, amp, blockNumber },
                                update: { amp, blockNumber },
                            }),
                        );
                    }
                }

                if (pool.type === 'LINEAR') {
                    if (!onchainData.targets) {
                        console.error(`Linear Pool Missing Targets: ${pool.id}`);
                        continue;
                    } else {
                        const lowerTarget = formatFixed(onchainData.targets[0], 18);
                        const upperTarget = formatFixed(onchainData.targets[1], 18);

                        if (
                            !pool.linearDynamicData ||
                            pool.linearDynamicData.lowerTarget !== lowerTarget ||
                            pool.linearDynamicData.upperTarget !== upperTarget
                        ) {
                            operations.push(
                                prisma.prismaPoolLinearDynamicData.upsert({
                                    where: { id_chain: { id: pool.id, chain: this.options.chain } },
                                    create: {
                                        id: pool.id,
                                        chain: this.options.chain,
                                        poolId: pool.id,
                                        upperTarget,
                                        lowerTarget,
                                        blockNumber,
                                    },
                                    update: { upperTarget, lowerTarget, blockNumber },
                                }),
                            );
                        }
                    }
                }

                const { swapFee, totalShares } = onchainData;
                const swapEnabled =
                    typeof onchainData.swapEnabled !== 'undefined'
                        ? onchainData.swapEnabled
                        : pool.dynamicData?.swapEnabled;

                const yieldProtocolFeePercentage =
                    gyroFees[pool.id] ||
                    onchainData.protocolYieldFeePercentageCache ||
                    String(this.options.yieldProtocolFeePercentage);

                if (
                    pool.dynamicData &&
                    (pool.dynamicData.swapFee !== swapFee ||
                        pool.dynamicData.totalShares !== totalShares ||
                        pool.dynamicData.swapEnabled !== swapEnabled ||
                        pool.dynamicData.protocolYieldFee !== yieldProtocolFeePercentage)
                ) {
                    operations.push(
                        prisma.prismaPoolDynamicData.update({
                            where: { id_chain: { id: pool.id, chain: this.options.chain } },
                            data: {
                                swapFee,
                                totalShares,
                                totalSharesNum: parseFloat(totalShares),
                                swapEnabled: typeof swapEnabled !== 'undefined' ? swapEnabled : true,
                                protocolYieldFee: yieldProtocolFeePercentage,
                                blockNumber,
                            },
                        }),
                    );
                }

                for (let i = 0; i < poolTokens.tokens.length; i++) {
                    const tokenAddress = poolTokens.tokens[i];
                    const poolToken = pool.tokens.find((token) => isSameAddress(token.address, tokenAddress));

                    if (!poolToken) {
                        throw `Pool Missing Expected Token: ${pool.id} ${tokenAddress}`;
                    }

                    if (poolToken.index !== i) {
                        throw `Pooltoken index mismatch! "poolToken.index": ${poolToken.index} vs "i": ${i} on pool ${pool.id}`;
                    }

                    const balance = poolTokens.balances[i];
                    const weight = onchainData.weights ? onchainData.weights[i] : null;

                    // set token price rate for various rate types

                    // top level token rates, e.g. LSTs in pools
                    let priceRate = poolTokens.rates[i] ?? '1.0';

                    // bpt price rate
                    if (onchainData.rate && isSameAddress(poolToken.address, pool.address)) {
                        priceRate = onchainData.rate;
                    }

                    // linear wrapped token rate
                    if (onchainData.wrappedTokenRate && pool.linearData?.wrappedIndex === poolToken.index) {
                        priceRate = onchainData.wrappedTokenRate;
                    }

                    if (
                        !poolToken.dynamicData ||
                        poolToken.dynamicData.balance !== balance ||
                        poolToken.dynamicData.priceRate !== priceRate ||
                        poolToken.dynamicData.weight !== weight
                    ) {
                        operations.push(
                            prisma.prismaPoolTokenDynamicData.upsert({
                                where: { id_chain: { id: poolToken.id, chain: this.options.chain } },
                                create: {
                                    id: poolToken.id,
                                    chain: this.options.chain,
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
                            }),
                        );
                    }
                }
            } catch (e) {
                console.log('error syncing on chain data', e);
            }
        }

        await prismaBulkExecuteOperations(operations, false);
    }
}
