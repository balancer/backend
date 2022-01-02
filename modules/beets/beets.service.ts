import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { cache } from '../cache/cache';
import { env } from '../../app/env';
import { GqlBeetsFarm, GqlBeetsFarmUser, GqlBeetsProtocolData } from '../../schema';
import { getCirculatingSupply } from './beets';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import { oneDayInMinutes } from '../util/time';

const PROTOCOL_DATA_CACHE_KEY = 'beetsProtocolData';
const FARMS_CACHE_KEY = 'beetsFarms';
const FARM_USERS_CACHE_KEY = 'beetsFarmUsers';

export class BeetsService {
    constructor() {}

    public async getProtocolData(): Promise<GqlBeetsProtocolData> {
        const protocolData = await cache.getObjectValue<GqlBeetsProtocolData>(PROTOCOL_DATA_CACHE_KEY);

        if (protocolData) {
            return protocolData;
        }

        return this.cacheProtocolData();
    }

    public async cacheProtocolData(): Promise<GqlBeetsProtocolData> {
        const { beetsPrice, marketCap, circulatingSupply } = await this.getBeetsData();
        const { totalLiquidity, totalSwapFee, totalSwapVolume, poolCount } =
            await balancerSubgraphService.getProtocolData({});

        const protocolData = {
            totalLiquidity,
            totalSwapFee,
            totalSwapVolume,
            beetsPrice,
            marketCap,
            circulatingSupply,
            poolCount: `${poolCount}`,
        };

        await cache.putObjectValue(PROTOCOL_DATA_CACHE_KEY, protocolData, 30);

        return protocolData;
    }

    public async getBeetsFarms(): Promise<GqlBeetsFarm[]> {
        const farms = await cache.getObjectValue<GqlBeetsFarm[]>(FARMS_CACHE_KEY);

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

        await cache.putObjectValue(FARMS_CACHE_KEY, mapped, oneDayInMinutes);

        return mapped;
    }

    public async getBeetsFarmUsers(): Promise<GqlBeetsFarmUser[]> {
        const farmUsers = await cache.getObjectValue<GqlBeetsFarmUser[]>(FARM_USERS_CACHE_KEY);

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

        await cache.putObjectValue(FARM_USERS_CACHE_KEY, mapped, 30);

        return mapped;
    }

    private async getBeetsData(): Promise<{ beetsPrice: string; marketCap: string; circulatingSupply: string }> {
        const { latestPrices } = await balancerSubgraphService.getLatestPrices({
            where: { poolId: env.FBEETS_POOL_ID.toLowerCase(), asset: env.BEETS_ADDRESS.toLowerCase() },
        });

        if (latestPrices.length === 0) {
            throw new Error('did not find price for beets');
        }

        const beetsPrice = parseFloat(latestPrices[0].priceUSD);
        const circulatingSupply = parseFloat(await getCirculatingSupply());

        return {
            beetsPrice: `${beetsPrice}`,
            marketCap: `${beetsPrice * circulatingSupply}`,
            circulatingSupply: `${circulatingSupply}`,
        };
    }
}

export const beetsService = new BeetsService();
