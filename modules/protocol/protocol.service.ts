import moment from 'moment-timezone';
import { prisma } from '../../prisma/prisma-client';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { Cache } from 'memory-cache';
import { Chain, PrismaLastBlockSyncedCategory, PrismaUserBalanceType } from '@prisma/client';
import _ from 'lodash';
import { networkContext } from '../network/network-context.service';
import { AllNetworkConfigs } from '../network/network-config';

interface ProtocolMetrics {
    poolCount: string;
    swapFee24h: string;
    swapVolume24h: string;
    swapFee7d: string;
    swapVolume7d: string;
    totalLiquidity: string;
    totalSwapFee: string;
    totalSwapVolume: string;
    numLiquidityProviders: string;
}

interface LatestSyncedBlocks {
    userWalletSyncBlock: string;
    userStakeSyncBlock: string;
    poolSyncBlock: string;
}

export const PROTOCOL_METRICS_CACHE_KEY = `protocol:metrics`;

export class ProtocolService {
    private cache = new Cache<string, ProtocolMetrics>();

    constructor(private balancerSubgraphService: BalancerSubgraphService) {}

    public async getGlobalMetrics(): Promise<ProtocolMetrics> {
        const chainMetrics: (ProtocolMetrics & { chainId: string })[] = [];

        for (const chainId of networkContext.protocolSupportedChainIds) {
            // this should resolve quickly if all chains are cached, possible to get slammed by an unlucky query though
            const metrics = await this.getMetrics(chainId);

            chainMetrics.push({
                chainId,
                ...metrics,
            });
        }

        const totalLiquidity = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.totalLiquidity));
        const totalSwapFee = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.totalSwapFee));
        const totalSwapVolume = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.totalSwapVolume));
        const poolCount = _.sumBy(chainMetrics, (metrics) => parseInt(metrics.poolCount));
        const swapVolume24h = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.swapVolume24h));
        const swapFee24h = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.swapFee24h));
        const swapVolume7d = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.swapVolume7d));
        const swapFee7d = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.swapFee7d));
        const numLiquidityProviders = _.sumBy(chainMetrics, (metrics) => parseInt(metrics.numLiquidityProviders));

        return {
            totalLiquidity: `${totalLiquidity}`,
            totalSwapFee: `${totalSwapFee}`,
            totalSwapVolume: `${totalSwapVolume}`,
            poolCount: `${poolCount}`,
            swapVolume24h: `${swapVolume24h}`,
            swapFee24h: `${swapFee24h}`,
            swapVolume7d: `${swapVolume7d}`,
            swapFee7d: `${swapFee7d}`,
            numLiquidityProviders: `${numLiquidityProviders}`,
        };
    }

    public async getMetrics(chainId: string): Promise<ProtocolMetrics> {
        const cached = this.cache.get(`${PROTOCOL_METRICS_CACHE_KEY}:${chainId}`);

        if (cached) {
            return cached;
        }

        return this.cacheProtocolMetrics(chainId, AllNetworkConfigs[chainId].data.chain.prismaId);
    }

    public async cacheProtocolMetrics(chainId: string, chain: Chain): Promise<ProtocolMetrics> {
        const { totalSwapFee, totalSwapVolume, poolCount } = await this.balancerSubgraphService.getProtocolData({});

        const oneDayAgo = moment().subtract(24, 'hours').unix();
        const sevenDaysAgo = moment().subtract(168, 'hours').unix();

        const pools = await prisma.prismaPool.findMany({
            where: {
                categories: { none: { category: 'BLACK_LISTED' } },
                type: { notIn: ['LINEAR'] },
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                },
                chain,
            },
            include: { dynamicData: true },
        });

        const swaps = await prisma.prismaPoolSwap.findMany({
            select: { poolId: true, valueUSD: true, timestamp: true },
            where: { timestamp: { gte: sevenDaysAgo }, chain },
        });
        const filteredSwaps = swaps.filter((swap) => pools.find((pool) => pool.id === swap.poolId));
        const filteredSwaps24h = filteredSwaps.filter((swap) => swap.timestamp >= oneDayAgo);

        const numLiquidityProviders = await prisma.prismaUser.count({
            where: {
                walletBalances: {
                    some: { chain: networkContext.chain, poolId: { not: null }, balanceNum: { gt: 0 } },
                },
                stakedBalances: {
                    some: { chain: networkContext.chain, poolId: { not: null }, balanceNum: { gt: 0 } },
                },
            },
        });

        const totalLiquidity = _.sumBy(pools, (pool) => (!pool.dynamicData ? 0 : pool.dynamicData.totalLiquidity));

        const swapVolume24h = _.sumBy(filteredSwaps24h, (swap) => swap.valueUSD);
        const swapFee24h = _.sumBy(filteredSwaps24h, (swap) => {
            const pool = pools.find((pool) => pool.id === swap.poolId);

            return parseFloat(pool?.dynamicData?.swapFee || '0') * swap.valueUSD;
        });

        const swapVolume7d = _.sumBy(filteredSwaps, (swap) => swap.valueUSD);
        const swapFee7d = _.sumBy(filteredSwaps, (swap) => {
            const pool = pools.find((pool) => pool.id === swap.poolId);

            return parseFloat(pool?.dynamicData?.swapFee || '0') * swap.valueUSD;
        });

        const protocolData: ProtocolMetrics = {
            totalLiquidity: `${totalLiquidity}`,
            totalSwapFee,
            totalSwapVolume,
            poolCount: `${poolCount}`,
            swapVolume24h: `${swapVolume24h}`,
            swapFee24h: `${swapFee24h}`,
            swapVolume7d: `${swapVolume7d}`,
            swapFee7d: `${swapFee7d}`,
            numLiquidityProviders: `${numLiquidityProviders}`,
        };

        this.cache.put(`${PROTOCOL_METRICS_CACHE_KEY}:${chainId}`, protocolData, 60 * 30 * 1000);

        return protocolData;
    }

    public async getLatestSyncedBlocks(): Promise<LatestSyncedBlocks> {
        const userStakeSyncBlock = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: PrismaUserBalanceType.STAKED, chain: networkContext.chain } },
        });

        const userWalletSyncBlock = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: PrismaUserBalanceType.WALLET, chain: networkContext.chain } },
        });

        const poolSyncBlock = await prisma.prismaLastBlockSynced.findUnique({
            where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain: networkContext.chain } },
        });

        return {
            userWalletSyncBlock: `${userWalletSyncBlock?.blockNumber}`,
            userStakeSyncBlock: `${userStakeSyncBlock?.blockNumber}`,
            poolSyncBlock: `${poolSyncBlock?.blockNumber}`,
        };
    }
}

export const protocolService = new ProtocolService(new BalancerSubgraphService());
