import { GqlBalancePoolAprItem, GqlBeetsFarm, GqlBeetsFarmUser } from '../../schema';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import { oneDayInMinutes, secondsPerYear } from '../util/time';
import { Cache, CacheClass } from 'memory-cache';
import { cache } from '../cache/cache';
import { tokenPriceService } from '../token-price/token-price.service';
import { tokenService } from '../token/token.service';

const FARMS_CACHE_KEY = 'beetsFarms';
const FARM_USERS_CACHE_KEY = 'beetsFarmUsers';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export class BeetsFarmService {
    cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getBeetsFarms(): Promise<GqlBeetsFarm[]> {
        const farms = await cache.getObjectValue<GqlBeetsFarm[]>(FARMS_CACHE_KEY);

        if (farms) {
            return farms;
        }

        return this.cacheBeetsFarms();
    }

    public async cacheBeetsFarms(): Promise<GqlBeetsFarm[]> {
        const tokenPrices = await tokenPriceService.getTokenPrices();
        const tokens = await tokenService.getTokens();
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
            rewarder:
                farm.rewarder && farm.rewarder.rewardToken !== ZERO_ADDRESS
                    ? {
                          ...farm.rewarder,
                          __typename: 'GqlBeetsRewarder',
                          tokens: [
                              {
                                  token: farm.rewarder.rewardToken,
                                  tokenPrice: tokenPriceService.getPriceForToken(
                                      tokenPrices,
                                      farm.rewarder.rewardToken,
                                  ),
                                  rewardPerSecond: `${Number(
                                      parseInt(farm.rewarder?.rewardPerSecond || '0') / (farm.id === '66' ? 1e6 : 1e18),
                                  )}`,
                                  symbol:
                                      tokens.find(
                                          (token) =>
                                              token.address.toLowerCase() === farm.rewarder?.rewardToken.toLowerCase(),
                                      )?.symbol || '',
                              },
                          ],
                      }
                    : null,
        }));

        await cache.putObjectValue(FARMS_CACHE_KEY, mapped, oneDayInMinutes);

        return mapped;
    }

    public async getBeetsFarmUsers(): Promise<GqlBeetsFarmUser[]> {
        const memCached = this.cache.get(FARM_USERS_CACHE_KEY) as GqlBeetsFarmUser[] | null;

        if (memCached) {
            return memCached;
        }

        const cached = await cache.getObjectValue<GqlBeetsFarmUser[]>(FARM_USERS_CACHE_KEY);

        if (cached) {
            this.cache.put(FARM_USERS_CACHE_KEY, cached, 15000);

            return cached;
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

    public calculateFarmApr(
        farm: GqlBeetsFarm,
        farmTvl: number,
        blocksPerYear: number,
        beetsPrice: number,
    ): { items: GqlBalancePoolAprItem[]; beetsApr: string; thirdPartyApr: string } {
        if (farmTvl <= 0) {
            return { items: [], beetsApr: '0', thirdPartyApr: '0' };
        }

        const beetsPerBlock = Number(parseInt(farm.masterChef.beetsPerBlock) / 1e18) * 0.872;
        const beetsPerYear = beetsPerBlock * blocksPerYear;
        const farmBeetsPerYear = (farm.allocPoint / farm.masterChef.totalAllocPoint) * beetsPerYear;
        const beetsValuePerYear = beetsPrice * farmBeetsPerYear;
        const items: GqlBalancePoolAprItem[] = [];
        const beetsApr = beetsValuePerYear / farmTvl;
        let thirdPartyApr = 0;

        if (beetsApr > 0) {
            items.push({
                title: 'BEETS reward APR',
                apr: `${beetsApr}`,
            });
        }

        (farm.rewarder?.tokens ?? []).forEach((rewardToken) => {
            const rewardTokenPerYear =
                Number(parseInt(farm.rewarder?.rewardPerSecond || '0') / (farm.id === '66' ? 1e6 : 1e18)) *
                secondsPerYear;
            const rewardTokenValuePerYear = rewardToken.tokenPrice * rewardTokenPerYear;
            const rewardApr = rewardTokenValuePerYear / farmTvl > 0 ? rewardTokenValuePerYear / farmTvl : 0;

            thirdPartyApr += rewardApr;

            items.push({
                title: `${rewardToken.symbol} reward APR`,
                apr: `${rewardApr}`,
            });
        });

        return { items, thirdPartyApr: `${thirdPartyApr}`, beetsApr: `${beetsApr > 0 ? beetsApr : 0}` };
    }
}

export const beetsFarmService = new BeetsFarmService();
