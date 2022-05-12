import { GqlBalancePoolAprItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import { getContractAt } from '../ethers/ethers';
import ReaperFarmBoostedAbi from './abi/ReaperFarmBoostedAbi.json';
import { tokenPriceService } from '../token-price/token-price.service';
import { TokenPrices } from '../token-price/token-price-types';

const REAPER_FARM_CACHE_KEY = 'spooky-swap';

interface ReaperFarmData {
    rfScTusdApr: number;
}

const TUSD_TOKEN_ADDRESS = '0x9879aBDea01a879644185341F7aF7d8343556B7a';
const RF_TUSD_STRATEGY_ADDRESS = '0x175D6eF56e2F5335D5d8f37C5c580CA438f83e9f';
const rfTusdStrategyContract = getContractAt(RF_TUSD_STRATEGY_ADDRESS, ReaperFarmBoostedAbi);

export class ReaperFarmService {
    private cache: CacheClass<string, ReaperFarmData>;

    constructor() {
        this.cache = new Cache<string, ReaperFarmData>();
    }

    public async cacheReaperFarmData(): Promise<void> {
        const rfScTusdApr = await rfTusdStrategyContract.averageAPRAcrossLastNHarvests(2);
        this.cache.put(REAPER_FARM_CACHE_KEY, { rfScTusdApr: parseFloat(rfScTusdApr.toString()) / 10000 }, 120000);
    }

    public getReaperFarmData(): ReaperFarmData {
        const cached = this.cache.get(REAPER_FARM_CACHE_KEY);

        return cached || { rfScTusdApr: 0 };
    }

    public getAprItemForBoostedPool(pool: GqlBalancerPool, tokenPrices: TokenPrices): GqlBalancePoolAprItem | null {
        for (const linearPool of pool.linearPools || []) {
            if (
                linearPool.address !== pool.address &&
                linearPool.mainToken.address.toLowerCase() === TUSD_TOKEN_ADDRESS.toLowerCase()
            ) {
                const poolToken = pool.tokens.find((token) => token.address === linearPool.address);
                const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, linearPool.mainToken.address);
                const reaperFarmData = this.getReaperFarmData();
                const mainTokens = parseFloat(linearPool.mainToken.balance);
                const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
                const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
                const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);
                const tusdLiquidity = mainTokens * tokenPrice + wrappedTokens * priceRate * tokenPrice;
                const poolTusdLiquidity =
                    (parseFloat(poolToken?.balance || '0') / parseFloat(linearPool.totalSupply)) * tusdLiquidity;
                const poolWrappedLiquidity = poolTusdLiquidity * percentWrapped;
                const apr = reaperFarmData.rfScTusdApr * (poolWrappedLiquidity / parseFloat(pool.totalLiquidity));

                return {
                    title: 'rf-scTUSD boosted APR',
                    apr: apr.toString(),
                };
            }
        }

        return null;
    }
}

export const reaperFarmService = new ReaperFarmService();
