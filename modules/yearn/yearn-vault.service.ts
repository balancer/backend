import axios from 'axios';
import { env } from '../../app/env';
import { YearnVault } from './yearn-types';
import { GqlBalancePoolAprItem, GqlBalancePoolAprSubItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import _ from 'lodash';

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

    public getAprItemForPhantomStablePool(pool: GqlBalancerPool): GqlBalancePoolAprItem | null {
        const subItems: GqlBalancePoolAprSubItem[] = [];
        const vaults = this.getYearnVaults();

        for (const linearPool of pool.linearPools || []) {
            const vault = vaults.find(
                (vault) => vault.address.toLowerCase() === linearPool.wrappedToken.address.toLowerCase(),
            );

            if (vault) {
                const mainTokens = parseFloat(linearPool.mainToken.balance);
                const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
                const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
                const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);

                subItems.push({
                    title: `${vault.token.symbol} APR`,
                    apr: `${vault.apy.net_apy * percentWrapped}`,
                });
            }
        }

        if (subItems.length > 0) {
            return {
                title: 'Yearn boosted APR',
                apr: `${_.sumBy(subItems, (subItem) => parseFloat(subItem.apr))}`,
                subItems,
            };
        }

        return null;
    }
}

export const yearnVaultService = new YearnVaultService();
