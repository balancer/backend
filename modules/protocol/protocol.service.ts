import moment from 'moment-timezone';
import { prisma } from '../../prisma/prisma-client';
import { Cache } from 'memory-cache';
import { Chain } from '@prisma/client';
import _ from 'lodash';
import { GqlProtocolMetricsAggregated, GqlProtocolMetricsChain } from '../../apps/api/gql/generated-schema';
import config from '../../config';

export const PROTOCOL_METRICS_CACHE_KEY = `protocol:metrics`;

export class ProtocolService {
    private cache = new Cache<string, GqlProtocolMetricsChain>();

    constructor() {}

    public async getAggregatedMetrics(chains: Chain[]): Promise<GqlProtocolMetricsAggregated> {
        const chainMetrics: GqlProtocolMetricsChain[] = [];

        for (const chain of chains) {
            // this should resolve quickly if all chains are cached, possible to get slammed by an unlucky query though
            const metrics = await this.getMetrics(chain);

            chainMetrics.push(metrics);
        }

        const totalLiquidity = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.totalLiquidity));
        const totalSwapFee = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.totalSwapFee));
        const totalSwapVolume = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.totalSwapVolume));
        const poolCount = _.sumBy(chainMetrics, (metrics) => parseInt(metrics.poolCount));
        const swapVolume24h = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.swapVolume24h));
        const swapFee24h = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.swapFee24h));
        const yieldCapture24h = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.yieldCapture24h));
        const surplus24h = _.sumBy(chainMetrics, (metrics) => parseFloat(metrics.surplus24h));
        const numLiquidityProviders = _.sumBy(chainMetrics, (metrics) => parseInt(metrics.numLiquidityProviders));

        return {
            totalLiquidity: `${totalLiquidity}`,
            totalSwapFee: `${totalSwapFee}`,
            totalSwapVolume: `${totalSwapVolume}`,
            poolCount: `${poolCount}`,
            swapVolume24h: `${swapVolume24h}`,
            swapFee24h: `${swapFee24h}`,
            yieldCapture24h: `${yieldCapture24h}`,
            surplus24h: `${surplus24h}`,
            numLiquidityProviders: `${numLiquidityProviders}`,
            chains: chainMetrics,
        };
    }

    public async getMetrics(chain: Chain): Promise<GqlProtocolMetricsChain> {
        const cached = this.cache.get(`${PROTOCOL_METRICS_CACHE_KEY}:${chain}`);

        if (cached) {
            return cached;
        }

        return this.cacheProtocolMetrics(chain);
    }

    public async cacheProtocolMetrics(chain: Chain): Promise<GqlProtocolMetricsChain> {
        const oneDayAgo = moment().subtract(24, 'hours').unix();

        const [dbPools, dynamicData] = await Promise.all([
            prisma.prismaPool.findMany({
                where: {
                    NOT: { categories: { has: 'BLACK_LISTED' } },
                    dynamicData: {
                        totalSharesNum: {
                            gt: 0.000000000001,
                        },
                    },
                    chain,
                },
            }),
            prisma.prismaPoolDynamicData
                .findMany({
                    where: { chain },
                })
                .then((records) => _.keyBy(records, 'id') as Record<string, (typeof records)[0]>),
            ,
        ]);

        const pools = dbPools
            .map((pool) => ({
                ...pool,
                dynamicData: dynamicData[pool.id],
            }))
            // Filter needed for test pools on Sepolia
            .filter((pool) => pool.dynamicData);

        const poolCount = pools.length;

        const holdersQueryResponse = await prisma.prismaPoolDynamicData.aggregate({
            _sum: { holdersCount: true },
            where: { chain },
        });

        const totalLiquidity = _.sumBy(pools, (pool) => (!pool.dynamicData ? 0 : pool.dynamicData.totalLiquidity));
        const swapVolume24h = _.sumBy(pools, (pool) => pool.dynamicData?.volume24h || 0);
        const swapFee24h = _.sumBy(pools, (pool) => pool.dynamicData?.fees24h || 0);

        const yieldCapture24h = _.sumBy(pools, (pool) => (!pool.dynamicData ? 0 : pool.dynamicData.yieldCapture24h));
        const surplus24 = _.sumBy(pools, (pool) => (!pool.dynamicData ? 0 : pool.dynamicData.surplus24h));

        const protocolSwapFees24h = _.sumBy(pools, (pool) =>
            !pool.dynamicData ? 0 : pool.dynamicData.protocolFees24h,
        );
        const protocolYieldCapture24h = _.sumBy(pools, (pool) =>
            !pool.dynamicData ? 0 : pool.dynamicData.protocolYieldCapture24h,
        );

        const balancerV1Tvl = await this.getBalancerV1Tvl(chain);
        const sftmxTvl = await this.getSftmXTVL(chain);
        const stsTVL = await this.getStsTVL(chain);

        const protocolData = {
            chainId: `${config[chain].chain.id}`,
            totalLiquidity: `${totalLiquidity + balancerV1Tvl + sftmxTvl + stsTVL}`,
            totalSwapFee: '0',
            totalSwapVolume: '0',
            poolCount: `${poolCount}`,
            swapVolume24h: `${swapVolume24h}`,
            swapFee24h: `${swapFee24h}`,
            yieldCapture24h: `${yieldCapture24h}`,
            surplus24h: `${surplus24}`,
            protocolSwapFee24h: `${protocolSwapFees24h}`,
            protocolYieldCapture24h: `${protocolYieldCapture24h}`,
            numLiquidityProviders: `${holdersQueryResponse._sum.holdersCount || '0'}`,
        };

        this.cache.put(`${PROTOCOL_METRICS_CACHE_KEY}:${chain}`, protocolData, 60 * 30 * 1000);

        return protocolData;
    }

    private async getSftmXTVL(chain: Chain): Promise<number> {
        if (chain !== 'FANTOM') {
            return 0;
        }

        const tokenAddress = config[chain].weth.address;
        const ftmPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: { tokenAddress, chain: 'FANTOM' },
        });

        return 0;
    }

    private async getStsTVL(chain: Chain): Promise<number> {
        if (chain !== 'SONIC') {
            return 0;
        }

        const tokenAddress = config[chain].weth.address;
        const sPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: { tokenAddress, chain: 'SONIC' },
        });

        if (config[chain].sts) {
            const stakingData = await prisma.prismaStakedSonicData.findUniqueOrThrow({
                where: { id: config[chain].sts!.address },
            });
            return parseFloat(stakingData.totalAssets) * (sPrice?.price || 0);
        }
        return 0;
    }

    private async getBalancerV1Tvl(chain: Chain): Promise<number> {
        if (chain !== 'MAINNET') {
            return 0;
        }

        const response = await fetch('https://api.llama.fi/tvl/balancer-v1');
        if (response.status !== 200) {
            return 0;
        }
        const data = (await response.json()) as number;

        return data;
    }
}

export const protocolService = new ProtocolService();
