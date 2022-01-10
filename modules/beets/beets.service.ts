import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { env } from '../../app/env';
import { GqlBeetsConfig, GqlBeetsFarm, GqlBeetsFarmUser, GqlBeetsProtocolData } from '../../schema';
import { getCirculatingSupply } from './beets';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import { thirtyMinInMs, twentyFourHoursInMs } from '../util/time';
import { Cache, CacheClass } from 'memory-cache';
import { balancerService } from '../balancer/balancer.service';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { sanityClient } from '../sanity/sanity';

const PROTOCOL_DATA_CACHE_KEY = 'beetsProtocolData';
const FARMS_CACHE_KEY = 'beetsFarms';
const FARM_USERS_CACHE_KEY = 'beetsFarmUsers';

export class BeetsService {
    cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getProtocolData(): Promise<GqlBeetsProtocolData> {
        const protocolData = this.cache.get(PROTOCOL_DATA_CACHE_KEY) as GqlBeetsProtocolData | null;

        if (protocolData) {
            return protocolData;
        }

        return this.cacheProtocolData();
    }

    public async cacheProtocolData(): Promise<GqlBeetsProtocolData> {
        const { beetsPrice, marketCap, circulatingSupply } = await this.getBeetsData();
        const { totalLiquidity, totalSwapFee, totalSwapVolume, poolCount } =
            await balancerSubgraphService.getProtocolData({});

        const block = await blocksSubgraphService.getBlockFrom24HoursAgo();
        const prev = await balancerSubgraphService.getProtocolData({ block: { number: parseInt(block.number) } });

        const protocolData: GqlBeetsProtocolData = {
            totalLiquidity,
            totalSwapFee,
            totalSwapVolume,
            beetsPrice,
            marketCap,
            circulatingSupply,
            poolCount: `${poolCount}`,
            swapVolume24h: `${parseFloat(totalSwapVolume) - parseFloat(prev.totalSwapVolume)}`,
            swapFee24h: `${parseFloat(totalSwapFee) - parseFloat(prev.totalSwapFee)}`,
        };

        this.cache.put(PROTOCOL_DATA_CACHE_KEY, protocolData, thirtyMinInMs);

        return protocolData;
    }

    public async getBeetsFarms(): Promise<GqlBeetsFarm[]> {
        const farms = this.cache.get(FARMS_CACHE_KEY) as GqlBeetsFarm[] | null;

        if (farms) {
            return farms;
        }

        return this.cacheBeetsFarms();
    }

    public async cacheBeetsFarms(): Promise<GqlBeetsFarm[]> {
        const farms = await masterchefService.getAllFarms({});
        const mapped: GqlBeetsFarm[] = farms.map((farm) => ({
            ...farm,
            __typename: 'GqlBeetsFarm',
            allocPoint: parseInt(farm.allocPoint),
            masterChef: {
                ...farm.masterChef,
                __typename: 'GqlBeetsMasterChef',
                totalAllocPoint: parseInt(farm.masterChef.totalAllocPoint),
            },
            rewarder: farm.rewarder ? { ...farm.rewarder, __typename: 'GqlBeetsRewarder' } : null,
        }));

        this.cache.put(FARMS_CACHE_KEY, mapped, twentyFourHoursInMs);

        return mapped;
    }

    public async getBeetsFarmUsers(): Promise<GqlBeetsFarmUser[]> {
        const farmUsers = this.cache.get(FARM_USERS_CACHE_KEY) as GqlBeetsFarmUser[] | null;

        if (farmUsers) {
            return farmUsers;
        }

        return this.cacheBeetsFarmUsers();
    }

    public async getBeetsFarmsForUser(userAddress: string): Promise<GqlBeetsFarmUser[]> {
        const farmUsers = await this.getBeetsFarmUsers();

        return farmUsers.filter((farmUser) => farmUser.address.toLowerCase() === userAddress);
    }

    public async getBeetsFarmUser(farmId: string, userAddress: string): Promise<GqlBeetsFarmUser | null> {
        const farmUsers = await this.getBeetsFarmUsers();
        const farmUser = farmUsers.find(
            (farmUser) => farmUser.farmId === farmId.toLowerCase() && farmUser.address === userAddress.toLowerCase(),
        );

        return farmUser ?? null;
    }

    public async cacheBeetsFarmUsers(): Promise<GqlBeetsFarmUser[]> {
        const farmUsers = await masterchefService.getAllFarmUsers({});
        const mapped: GqlBeetsFarmUser[] = farmUsers.map((farmUser) => ({
            ...farmUser,
            __typename: 'GqlBeetsFarmUser',
            farmId: farmUser.pool?.id || '',
        }));

        this.cache.put(FARM_USERS_CACHE_KEY, mapped, thirtyMinInMs);

        return mapped;
    }

    public async getConfig(): Promise<GqlBeetsConfig> {
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

        return {
            pausedPools: config?.pausedPools ?? [],
            featuredPools: config?.featuredPools ?? [],
            homeFeaturedPools: config?.homeFeaturedPools ?? [],
            incentivizedPools: config?.incentivizedPools ?? [],
            blacklistedPools: config?.blacklistedPools ?? [],
            homeNewsItems: config?.homeNewsItems ?? [],
        };
    }

    private async getBeetsData(): Promise<{ beetsPrice: string; marketCap: string; circulatingSupply: string }> {
        const pools = await balancerService.getPools();
        const beetsUsdcPool = pools.find(
            (pool) => pool.id === '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
        );
        const beets = (beetsUsdcPool?.tokens ?? []).find((token) => token.address === env.BEETS_ADDRESS.toLowerCase());
        const usdc = (beetsUsdcPool?.tokens ?? []).find((token) => token.address !== env.BEETS_ADDRESS.toLowerCase());

        if (!beets || !usdc) {
            throw new Error('did not find price for beets');
        }

        const beetsPrice =
            ((parseFloat(beets.weight || '0') / parseFloat(usdc.weight || '1')) * parseFloat(usdc.balance)) /
            parseFloat(beets.balance);
        const circulatingSupply = parseFloat(await getCirculatingSupply());

        return {
            beetsPrice: `${beetsPrice}`,
            marketCap: `${beetsPrice * circulatingSupply}`,
            circulatingSupply: `${circulatingSupply}`,
        };
    }
}

export const beetsService = new BeetsService();
