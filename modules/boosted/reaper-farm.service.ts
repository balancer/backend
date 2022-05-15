import { GqlBalancePoolAprItem, GqlBalancePoolAprSubItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import { getContractAt } from '../ethers/ethers';
import ReaperFarmBoostedAbi from './abi/ReaperFarmBoostedAbi.json';
import { tokenPriceService } from '../token-price/token-price.service';
import { TokenPrices } from '../token-price/token-price-types';
import _ from 'lodash';

const REAPER_FARM_CACHE_KEY = 'reaper-farm';

interface ReaperFarmData {
    address: string;
    apr: number;
}

export class ReaperFarmService {
    private cache: CacheClass<string, ReaperFarmData[]>;
    private boostedPools = [
        {
            address: '0x9879aBDea01a879644185341F7aF7d8343556B7a', // TUSD
            strategy: '0x175D6eF56e2F5335D5d8f37C5c580CA438f83e9f', // TUSD strategy
        },
    ];

    constructor() {
        this.cache = new Cache<string, ReaperFarmData[]>();
    }

    public async cacheReaperFarmData(): Promise<void> {
        let data: ReaperFarmData[] = [];

        for (const pool of this.boostedPools) {
            const strategyContract = getContractAt(pool.strategy, ReaperFarmBoostedAbi);
            const apr = await strategyContract.averageAPRAcrossLastNHarvests(2);

            data.push({
                address: pool.address,
                apr: parseFloat(apr.toString()) / 10000,
            });
        }

        this.cache.put(REAPER_FARM_CACHE_KEY, data, 120000);
    }

    public getReaperFarmData(): ReaperFarmData[] {
        const cached = this.cache.get(REAPER_FARM_CACHE_KEY);

        return cached || [];
    }

    public getAprItemForBoostedPool(pool: GqlBalancerPool, tokenPrices: TokenPrices): GqlBalancePoolAprItem | null {
        const subItems: GqlBalancePoolAprSubItem[] = [];
        const boostedPools = this.getReaperFarmData();

        for (const linearPool of pool.linearPools || []) {
            const boostedPool = boostedPools.find(
                (boostedPool) => boostedPool.address.toLowerCase() === linearPool.mainToken.address.toLowerCase(),
            );

            if (!boostedPool || linearPool.address === pool.address) {
                continue;
            }

            const poolToken = pool.tokens.find((token) => token.address === linearPool.address);
            const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, linearPool.mainToken.address);
            const mainTokens = parseFloat(linearPool.mainToken.balance);
            const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
            const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
            const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);
            const liquidity = mainTokens * tokenPrice + wrappedTokens * priceRate * tokenPrice;
            const poolLiquidity =
                (parseFloat(poolToken?.balance || '0') / parseFloat(linearPool.totalSupply)) * liquidity;
            const poolWrappedLiquidity = poolLiquidity * percentWrapped;
            const apr = boostedPool.apr * (poolWrappedLiquidity / parseFloat(pool.totalLiquidity));

            subItems.push({
                title: `${linearPool.wrappedToken.symbol} APR`,
                apr: apr.toString(),
            });

            if (subItems.length > 0) {
                return {
                    title: 'Reaper boosted APR',
                    apr: `${_.sumBy(subItems, (item) => parseFloat(item.apr))}`,
                    subItems,
                };
            }
        }

        return null;
    }
}

export const reaperFarmService = new ReaperFarmService();
