import { Chain, PrismaPoolType, PrismaTokenCurrentPrice } from '@prisma/client';
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
import type { ParsedOnchainData, PoolInput, TokenPairData } from './types';

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

        const state = await fetchOnChainPoolState(
            filteredPools,
            this.options.chain === 'ZKEVM' || this.options.chain === 'FANTOM' ? 190 : 400,
        );

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

    public async updateOnChainData(poolIds: string[], blockNumber: number, chain: Chain): Promise<void> {
        if (poolIds.length === 0) return;

        const filteredPools = await this.fetchFilteredPools(poolIds, chain);
        if (filteredPools.length === 0) return;

        const [tokenPrices, onchainResults, tokenPairData, gyroFees] = await Promise.all([
            this.tokenService.getTokenPrices(),
            this.fetchOnChainPoolData(filteredPools, chain),
            this.fetchTokenPairData(filteredPools, chain),
            this.fetchGyroFees(filteredPools, chain),
        ]);

        const operations = filteredPools.flatMap((pool) =>
            this.syncPoolData(
                pool,
                onchainResults[pool.id],
                tokenPairData[pool.id].tokenPairs,
                tokenPrices,
                gyroFees,
                blockNumber,
            ),
        );

        await prismaBulkExecuteOperations(operations, false);
    }

    private async fetchFilteredPools(poolIds: string[], chain: Chain) {
        return prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
                chain,
                type: { in: SUPPORTED_POOL_TYPES },
            },
            include: {
                tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true, token: true } },
                dynamicData: true,
            },
        });
    }

    private async fetchOnChainPoolData(filteredPools: PoolInput[], chain: Chain) {
        return fetchOnChainPoolData(
            filteredPools,
            this.options.vaultAddress,
            ['ZKEVM', 'FANTOM'].includes(chain) ? 190 : 400,
        );
    }

    private async fetchTokenPairData(filteredPools: PoolInput[], chain: Chain) {
        return fetchTokenPairData(
            filteredPools,
            this.options.balancerQueriesAddress,
            ['ZKEVM', 'FANTOM'].includes(chain) ? 190 : 400,
        );
    }

    private async fetchGyroFees(filteredPools: PoolInput[], chain: Chain) {
        const gyroPools = filteredPools.filter((pool) => pool.type.includes('GYRO'));
        if (!this.options.gyroConfig) return {};

        return fetchOnChainGyroFees(
            gyroPools,
            this.options.gyroConfig,
            ['ZKEVM', 'FANTOM'].includes(chain) ? 190 : 1024,
        );
    }

    private syncPoolData(
        pool: PoolInput,
        onchainData: ParsedOnchainData,
        tokenPairs: TokenPairData[],
        tokenPrices: PrismaTokenCurrentPrice[],
        gyroFees: { [address: string]: string },
        blockNumber: number,
    ) {
        const operations: any[] = [];

        this.syncStablePoolData(pool, onchainData, operations);
        this.syncDynamicPoolData(pool, onchainData, gyroFees, blockNumber, operations);
        this.syncTokenPairsData(pool, tokenPairs, blockNumber, operations);
        this.syncPoolTokensData(pool, onchainData, tokenPrices, blockNumber, operations);

        return operations;
    }

    private syncStablePoolData(pool: PoolInput, onchainData: ParsedOnchainData, operations: any[]) {
        if (isStablePool(pool.type)) {
            const amp = onchainData.amp;
            if (!amp) {
                console.error(`Stable Pool Missing Amp: ${pool.id}`);
                return;
            }

            const stableData = pool.typeData as StableData;
            if (stableData.amp !== amp) {
                operations.push(
                    prisma.prismaPool.update({
                        where: { id_chain: { id: pool.id, chain: this.options.chain } },
                        data: { typeData: { ...stableData, amp } },
                    }),
                );
            }
        }
    }

    private syncDynamicPoolData(
        pool: PoolInput,
        onchainData: ParsedOnchainData,
        gyroFees: { [address: string]: string },
        blockNumber: number,
        operations: any[],
    ) {
        const { swapFee, totalShares, swapEnabled = pool.dynamicData?.swapEnabled } = onchainData;
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
    }

    private syncTokenPairsData(pool: PoolInput, tokenPairs: any, blockNumber: number, operations: any[]) {
        if (pool.dynamicData) {
            operations.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: pool.id, chain: this.options.chain } },
                    data: { tokenPairsData: tokenPairs },
                }),
            );
        }
    }

    private syncPoolTokensData(
        pool: PoolInput,
        onchainData: ParsedOnchainData,
        tokenPrices: PrismaTokenCurrentPrice[],
        blockNumber: number,
        operations: any[],
    ) {
        const { poolTokens } = onchainData;

        poolTokens.tokens.forEach((tokenAddress, i) => {
            const poolToken = pool.tokens.find((token) => isSameAddress(token.address, tokenAddress));

            if (!poolToken) throw `Pool Missing Expected Token: ${pool.id} ${tokenAddress}`;
            if (poolToken.index !== i)
                throw `Pooltoken index mismatch! "poolToken.index": ${poolToken.index} vs "i": ${i} on pool ${pool.id}`;

            const balance = poolTokens.balances[i];
            const weight = onchainData.weights ? onchainData.weights[i] : null;
            const priceRate = this.calculateTokenPriceRate(poolToken, pool, onchainData, i);

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
                            balanceUSD: this.calculateBalanceUSD(poolToken, pool, tokenPrices, balance),
                        },
                        update: {
                            blockNumber,
                            priceRate,
                            weight,
                            balance,
                            balanceUSD: this.calculateBalanceUSD(poolToken, pool, tokenPrices, balance),
                        },
                    }),
                );
            }
        });
    }

    private calculateTokenPriceRate(
        poolToken: { address: string },
        pool: { address: string },
        onchainData: ParsedOnchainData,
        index: number,
    ): string {
        // set token price rate for various rate types
        let priceRate = onchainData.poolTokens.rates ? onchainData.poolTokens.rates[index] : '1.0';

        // bpt price rate
        if (onchainData.rate && isSameAddress(poolToken.address, pool.address)) {
            priceRate = onchainData.rate;
        }

        return String(priceRate);
    }

    private calculateBalanceUSD(
        poolToken: { address: string },
        pool: { address: string },
        tokenPrices: PrismaTokenCurrentPrice[],
        balance: string,
    ): number {
        return poolToken.address === pool.address
            ? 0
            : this.tokenService.getPriceForToken(tokenPrices, poolToken.address, this.options.chain) *
                  parseFloat(balance);
    }
}
