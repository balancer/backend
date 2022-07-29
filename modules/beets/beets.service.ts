import { FbeetsService } from './lib/fbeets.service';
import { getContractAt } from '../util/ethers';
import { networkConfig } from '../config/network-config';
import FreshBeetsAbi from './abi/FreshBeets.json';
import ERC20 from '../abi/ERC20.json';
import { GqlBeetsConfig, GqlBeetsProtocolData } from '../../schema';
import {
    BalancerSubgraphService,
    balancerSubgraphService,
} from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { beetsGetCirculatingSupply } from './lib/beets';
import _ from 'lodash';
import { sanityClient } from '../util/sanity';
import { env } from '../../app/env';
import { memCacheGetValue, memCacheSetValue } from '../util/mem-cache';
import { tokenService } from '../token/token.service';
import moment from 'moment-timezone';
import { prisma } from '../util/prisma-client';

const PROTOCOL_DATA_CACHE_KEY = 'beets:protocol-data';
const CONFIG_CACHE_KEY = 'beets:global-config';

export class BeetsService {
    constructor(
        private readonly fBeetsService: FbeetsService,
        private readonly balancerSubgraphService: BalancerSubgraphService,
    ) {}

    public async getFbeetsRatio(): Promise<string> {
        return this.fBeetsService.getRatio();
    }

    public async getProtocolData(): Promise<GqlBeetsProtocolData> {
        const memCached = memCacheGetValue<GqlBeetsProtocolData>(PROTOCOL_DATA_CACHE_KEY);

        if (memCached) {
            return memCached;
        }

        return this.cacheProtocolData();
    }

    public async cacheProtocolData(): Promise<GqlBeetsProtocolData> {
        const { totalSwapFee, totalSwapVolume, poolCount } = await this.balancerSubgraphService.getProtocolData({});
        const tokenPrices = await tokenService.getTokenPrices();
        const beetsPrice = tokenService.getPriceForToken(tokenPrices, networkConfig.beets.address);
        const fbeetsPrice = tokenService.getPriceForToken(tokenPrices, networkConfig.fbeets.address);
        const circulatingSupply = parseFloat(await beetsGetCirculatingSupply());

        const oneDayAgo = moment().subtract(24, 'hours').unix();
        const pools = await prisma.prismaPool.findMany({
            where: { categories: { none: { category: 'BLACK_LISTED' } } },
            include: { dynamicData: true },
        });
        const swaps = await prisma.prismaPoolSwap.findMany({ where: { timestamp: { gte: oneDayAgo } } });
        const filteredSwaps = swaps.filter((swap) => pools.find((pool) => pool.id === swap.poolId));

        const { excludedPools } = await this.getConfig();
        const totalLiquidity = _.sumBy(pools, (pool) =>
            excludedPools.includes(pool.id) || !pool.dynamicData ? 0 : pool.dynamicData.totalLiquidity,
        );

        const swapVolume24h = _.sumBy(filteredSwaps, (swap) => swap.valueUSD);
        const swapFee24h = _.sumBy(filteredSwaps, (swap) => {
            const pool = pools.find((pool) => pool.id === swap.poolId);

            return parseFloat(pool?.dynamicData?.swapFee || '0') * swap.valueUSD;
        });

        const protocolData: GqlBeetsProtocolData = {
            totalLiquidity: `${totalLiquidity}`,
            totalSwapFee,
            totalSwapVolume,
            beetsPrice: `${beetsPrice}`,
            fbeetsPrice: `${fbeetsPrice}`,
            marketCap: `${beetsPrice * circulatingSupply}`,
            circulatingSupply: `${circulatingSupply}`,
            poolCount: `${poolCount}`,
            swapVolume24h: `${swapVolume24h}`,
            swapFee24h: `${swapFee24h}`,
        };

        memCacheSetValue(PROTOCOL_DATA_CACHE_KEY, protocolData, 60 * 30);

        return protocolData;
    }

    public async getConfig(): Promise<GqlBeetsConfig> {
        const cached = memCacheGetValue<GqlBeetsConfig>(CONFIG_CACHE_KEY);

        if (cached) {
            return cached;
        }

        const config = await sanityClient.fetch(`
            *[_type == "config" && chainId == ${env.CHAIN_ID}][0]{
                ...,
                "homeFeaturedPools": homeFeaturedPools[]{
                    ...,
                    "image": image.asset->url + "?w=600"
                },
                "homeNewsItems": homeNewsItems[]{
                    ...,
                    "image": image.asset->url + "?w=600"
                },
                "homeEducationItems": homeEducationItems[]{
                    ...,
                    "image": image.asset->url + "?w=600"
                }
            }
        `);

        const beetsConfig: GqlBeetsConfig = {
            pausedPools: config?.pausedPools ?? [],
            featuredPools: config?.featuredPools ?? [],
            homeFeaturedPools: config?.homeFeaturedPools ?? [],
            incentivizedPools: config?.incentivizedPools ?? [],
            blacklistedPools: config?.blacklistedPools ?? [],
            homeNewsItems: config?.homeNewsItems ?? [],
            homeEducationItems: config?.homeEducationItems ?? [],
            poolFilters: config?.poolFilters ?? [],
            excludedPools: config?.excludedPools ?? [],
            blacklistedTokens: config?.blacklistedTokens ?? [],
            boostedPools: config?.boostedPools ?? [],
        };

        memCacheSetValue(CONFIG_CACHE_KEY, beetsConfig, 60 * 5);

        return beetsConfig;
    }

    public async syncFbeetsRatio(): Promise<void> {
        return this.fBeetsService.syncRatio();
    }
}

export const beetsService = new BeetsService(
    new FbeetsService(
        getContractAt(networkConfig.fbeets.address, FreshBeetsAbi),
        getContractAt(networkConfig.fbeets.poolAddress, ERC20),
    ),
    balancerSubgraphService,
);
