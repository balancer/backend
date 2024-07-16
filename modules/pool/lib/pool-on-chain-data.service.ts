import { formatFixed } from '@ethersproject/bignumber';
import { Prisma, PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { prisma } from '../../../prisma/prisma-client';
import { isStablePool } from './pool-utils';
import { TokenService } from '../../token/token.service';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { fetchOnChainPoolState } from './pool-onchain-state';
import { fetchOnChainPoolData } from './pool-onchain-data';
import { fetchOnChainGyroFees } from './pool-onchain-gyro-fee';
import { networkContext } from '../../network/network-context.service';
import { StableData } from '../subgraph-mapper';
import { fetchTokenPairData } from './pool-on-chain-tokenpair-data';

export const SUPPORTED_POOL_TYPES: PrismaPoolType[] = [
    'WEIGHTED',
    'STABLE',
    'META_STABLE',
    'PHANTOM_STABLE',
    'COMPOSABLE_STABLE',
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
            vaultAddress: networkContext.data.balancer.v2.vaultAddress,
            balancerQueriesAddress: networkContext.data.balancer.v2.balancerQueriesAddress,
            yieldProtocolFeePercentage: networkContext.data.balancer.v2.defaultSwapFeePercentage,
            swapProtocolFeePercentage: networkContext.data.balancer.v2.defaultSwapFeePercentage,
            gyroConfig: networkContext.data.gyro?.config,
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

        const state = await fetchOnChainPoolState(filteredPools, networkContext.chain === 'ZKEVM' ? 190 : 400);

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
                dynamicData: true,
            },
        });

        const gyroPools = filteredPools.filter((pool) => pool.type.includes('GYRO'));

        const tokenPrices = await this.tokenService.getTokenPrices();
        const onchainResults = await fetchOnChainPoolData(
            filteredPools,
            this.options.vaultAddress,
            this.options.chain === 'ZKEVM' ? 190 : 400,
        );
        const tokenPairData = await fetchTokenPairData(
            filteredPools,
            this.options.balancerQueriesAddress,
            this.options.chain === 'ZKEVM' ? 190 : 400,
        );
        const gyroFees = await (this.options.gyroConfig
            ? fetchOnChainGyroFees(gyroPools, this.options.gyroConfig, networkContext.chain === 'ZKEVM' ? 190 : 1024)
            : Promise.resolve({} as { [address: string]: string }));

        const operations = [];
        for (const pool of filteredPools) {
            const onchainData = onchainResults[pool.id];
            const { tokenPairs } = tokenPairData[pool.id];
            const { amp, poolTokens } = onchainData;

            try {
                if (isStablePool(pool.type)) {
                    if (!amp) {
                        console.error(`Stable Pool Missing Amp: ${pool.id}`);
                        continue;
                    }

                    //only update if amp has changed
                    if ((pool.typeData as StableData).amp !== amp) {
                        operations.push(
                            prisma.prismaPool.update({
                                where: { id_chain: { id: pool.id, chain: this.options.chain } },
                                data: {
                                    typeData: {
                                        ...(pool.typeData as StableData),
                                        amp,
                                    },
                                },
                            }),
                        );
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

                const swapProtocolFeePercentage =
                    gyroFees[pool.id] ||
                    onchainData.protocolSwapFeePercentageCache ||
                    String(this.options.swapProtocolFeePercentage);

                if (
                    pool.dynamicData &&
                    (pool.dynamicData.swapFee !== swapFee ||
                        pool.dynamicData.totalShares !== totalShares ||
                        pool.dynamicData.swapEnabled !== swapEnabled ||
                        pool.dynamicData.protocolYieldFee !== yieldProtocolFeePercentage ||
                        pool.dynamicData.protocolSwapFee !== swapProtocolFeePercentage)
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
                                protocolSwapFee: swapProtocolFeePercentage,
                                blockNumber,
                            },
                        }),
                    );
                }

                // always update tokenPair data
                if (pool.dynamicData) {
                    operations.push(
                        prisma.prismaPoolDynamicData.update({
                            where: { id_chain: { id: pool.id, chain: this.options.chain } },
                            data: {
                                tokenPairsData: tokenPairs,
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
                                            : this.tokenService.getPriceForToken(
                                                  tokenPrices,
                                                  poolToken.address,
                                                  this.options.chain,
                                              ) * parseFloat(balance),
                                },
                                update: {
                                    blockNumber,
                                    priceRate,
                                    weight,
                                    balance,
                                    balanceUSD:
                                        poolToken.address === pool.address
                                            ? 0
                                            : this.tokenService.getPriceForToken(
                                                  tokenPrices,
                                                  poolToken.address,
                                                  this.options.chain,
                                              ) * parseFloat(balance),
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
