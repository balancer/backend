import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { env } from '../../app/env';
import { GqlBeetsConfig, GqlBeetsProtocolData } from '../../schema';
import { getCirculatingSupply } from './beets';
import { fiveMinutesInMs } from '../util/time';
import { Cache, CacheClass } from 'memory-cache';
import { balancerService } from '../balancer/balancer.service';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { sanityClient } from '../sanity/sanity';
import { cache } from '../cache/cache';
import { beetsBarService } from '../beets-bar-subgraph/beets-bar.service';

const PROTOCOL_DATA_CACHE_KEY = 'beetsProtocolData';
const CONFIG_CACHE_KEY = 'beetsConfig';

export class BeetsService {
    cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getProtocolData(): Promise<GqlBeetsProtocolData> {
        const memCached = this.cache.get(PROTOCOL_DATA_CACHE_KEY) as GqlBeetsProtocolData | null;

        if (memCached) {
            return memCached;
        }

        const cached = await cache.getObjectValue<GqlBeetsProtocolData>(PROTOCOL_DATA_CACHE_KEY);

        if (cached) {
            this.cache.put(PROTOCOL_DATA_CACHE_KEY, cached, 15000);

            return cached;
        }

        return this.cacheProtocolData();
    }

    public async cacheProtocolData(): Promise<GqlBeetsProtocolData> {
        const { beetsPrice, marketCap, circulatingSupply, fbeetsPrice } = await this.getBeetsData();
        const { totalLiquidity, totalSwapFee, totalSwapVolume, poolCount } =
            await balancerSubgraphService.getProtocolData({});

        const block = await blocksSubgraphService.getBlockFrom24HoursAgo();
        const prev = await balancerSubgraphService.getProtocolData({ block: { number: parseInt(block.number) } });

        const protocolData: GqlBeetsProtocolData = {
            totalLiquidity,
            totalSwapFee,
            totalSwapVolume,
            beetsPrice,
            fbeetsPrice,
            marketCap,
            circulatingSupply,
            poolCount: `${poolCount}`,
            swapVolume24h: `${parseFloat(totalSwapVolume) - parseFloat(prev.totalSwapVolume)}`,
            swapFee24h: `${parseFloat(totalSwapFee) - parseFloat(prev.totalSwapFee)}`,
        };

        await cache.putObjectValue(PROTOCOL_DATA_CACHE_KEY, protocolData, 30);

        return protocolData;
    }

    public async getConfig(): Promise<GqlBeetsConfig> {
        const cached = this.cache.get(CONFIG_CACHE_KEY) as GqlBeetsConfig | null;

        if (cached) {
            return cached;
        }

        const config = await sanityClient.fetch(`
            *[_type == "config" && chainId == ${env.CHAIN_ID}][0]{
                ...,
                "homeFeaturedPools": homeFeaturedPools[]{
                    ...,
                    "image": image.asset->url
                },
                "homeNewsItems": homeNewsItems[]{
                    ...,
                    "image": image.asset->url
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
            poolFilters: config?.poolFilters ?? [],
        };

        this.cache.put(CONFIG_CACHE_KEY, beetsConfig, fiveMinutesInMs);

        return beetsConfig;
    }

    private async getBeetsData(): Promise<{
        beetsPrice: string;
        marketCap: string;
        circulatingSupply: string;
        fbeetsPrice: string;
    }> {
        if (env.CHAIN_ID !== '250') {
            return { beetsPrice: '0', marketCap: '0', circulatingSupply: '0', fbeetsPrice: '0' };
        }

        const pools = await balancerService.getPools();
        const beetsUsdcPool = pools.find(
            (pool) => pool.id === '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
        );
        const beets = (beetsUsdcPool?.tokens ?? []).find((token) => token.address === env.BEETS_ADDRESS.toLowerCase());
        const usdc = (beetsUsdcPool?.tokens ?? []).find((token) => token.address !== env.BEETS_ADDRESS.toLowerCase());

        const beetsFtmPool = pools.find(
            (pool) => pool.id === '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
        );

        if (!beets || !usdc || !beetsFtmPool) {
            throw new Error('did not find price for beets');
        }

        const bptPrice = parseFloat(beetsFtmPool.totalLiquidity) / parseFloat(beetsFtmPool.totalShares);
        const beetsBar = await beetsBarService.getBeetsBarNow();
        const fbeetsPrice = bptPrice * parseFloat(beetsBar.ratio);

        const beetsPrice =
            ((parseFloat(beets.weight || '0') / parseFloat(usdc.weight || '1')) * parseFloat(usdc.balance)) /
            parseFloat(beets.balance);
        const circulatingSupply = parseFloat(await getCirculatingSupply());

        return {
            beetsPrice: `${beetsPrice}`,
            marketCap: `${beetsPrice * circulatingSupply}`,
            circulatingSupply: `${circulatingSupply}`,
            fbeetsPrice: `${fbeetsPrice}`,
        };
    }
}

export const beetsService = new BeetsService();
