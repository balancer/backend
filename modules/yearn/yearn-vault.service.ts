import axios from 'axios';
import { env } from '../../app/env';
import { YearnVault } from './yearn-types';
import { GqlBalancePoolAprItem, GqlBalancePoolAprSubItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import _ from 'lodash';
import { TokenPrices } from '../token-price/token-price-types';
import { tokenPriceService } from '../token-price/token-price.service';

const VAULTS_CACHE_KEY = 'yearn:vaults';

export class YearnVaultService {
    cache: CacheClass<string, YearnVault[]>;

    constructor() {
        this.cache = new Cache<string, YearnVault[]>();
    }

    public async cacheYearnVaults(): Promise<void> {
        const { data } = await axios.get<YearnVault[]>(env.YEARN_VAULTS_ENDPOINT);
        this.cache.put(VAULTS_CACHE_KEY, data, 120000);
    }

    public getYearnVaults(): YearnVault[] {
        const cached = this.cache.get(VAULTS_CACHE_KEY);

        return cached || [];
    }

    public getAprItemForPhantomStablePool(
        pool: GqlBalancerPool,
        tokenPrices: TokenPrices,
    ): GqlBalancePoolAprItem | null {
        const items: { title: string; apr: number; totalLiquidity: number; wrappedLiquidity: number }[] = [];
        const vaults = this.getYearnVaults();

        for (const linearPool of pool.linearPools || []) {
            const vault = vaults.find(
                (vault) => vault.address.toLowerCase() === linearPool.wrappedToken.address.toLowerCase(),
            );

            if (vault) {
                const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, linearPool.mainToken.address);
                const mainTokens = parseFloat(linearPool.mainToken.balance);
                const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
                const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
                const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);

                items.push({
                    title: `${vault.symbol} APR`,
                    apr: vault.apy.net_apy * percentWrapped,
                    totalLiquidity: mainTokens * tokenPrice + wrappedTokens * priceRate * tokenPrice,
                    wrappedLiquidity: wrappedTokens * priceRate * tokenPrice,
                });
            }
        }

        if (items.length > 0) {
            const totalLiquidity = _.sumBy(items, (item) => item.totalLiquidity);

            return {
                title: 'Yearn boosted APR',
                apr: `${_.sumBy(items, (item) => (item.wrappedLiquidity / totalLiquidity) * item.apr)}`,
                subItems: items.map((item) => ({
                    ...item,
                    apr: `${(item.wrappedLiquidity / totalLiquidity) * item.apr}`,
                })),
            };
        }

        return null;
    }
}

export const yearnVaultService = new YearnVaultService();
