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

    public getAprItemForBoostedPool(
        pool: GqlBalancerPool,
        tokenPrices: TokenPrices,
        bbyvUsd: GqlBalancerPool,
    ): GqlBalancePoolAprItem | null {
        const subItems: GqlBalancePoolAprSubItem[] = [];
        const vaults = this.getYearnVaults();

        for (const linearPool of pool.linearPools || []) {
            const vault = vaults.find(
                (vault) => vault.address.toLowerCase() === linearPool.wrappedToken.address.toLowerCase(),
            );

            if (!vault) {
                continue;
            }

            const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, linearPool.mainToken.address);
            const mainTokens = parseFloat(linearPool.mainToken.balance);
            const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
            const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
            //percent of pool wrapped
            const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);
            const linearPoolLiquidity = mainTokens * tokenPrice + wrappedTokens * priceRate * tokenPrice;
            const linearPoolApr = vault.apy.net_apy * percentWrapped;

            let poolToken = pool.tokens.find((token) => token.address === linearPool.address);
            let percentOfWhole = 1;
            let poolTotalLiquidity = parseFloat(pool.totalLiquidity);
            let linearLiquidityInPool = linearPoolLiquidity;

            //TODO: this works, but its fugly as hell, revisit this.
            if (!poolToken) {
                //the linear bpt is nested in bbyvUsd
                poolToken = bbyvUsd.tokens.find((token) => token.address === linearPool.address);

                const bbyvUsdBalance = parseFloat(
                    pool.tokens.find((token) => token.address === bbyvUsd.address)?.balance || '0',
                );

                const bbyvUsdLiquidity =
                    (bbyvUsdBalance / parseFloat(bbyvUsd.totalShares)) * parseFloat(bbyvUsd.totalLiquidity);
                percentOfWhole = bbyvUsdLiquidity / parseFloat(pool.totalLiquidity);
                poolTotalLiquidity = parseFloat(bbyvUsd.totalLiquidity);
            } else {
                //pool
                linearLiquidityInPool =
                    linearPoolLiquidity * (parseFloat(poolToken.balance) / parseFloat(linearPool.totalSupply));
            }

            subItems.push({
                title: `${vault.symbol} APR`,
                apr: `${linearPoolApr * (linearLiquidityInPool / poolTotalLiquidity) * percentOfWhole}`,
            });
        }

        if (subItems.length > 0) {
            return {
                title: 'Yearn boosted APR',
                apr: `${_.sumBy(subItems, (item) => parseFloat(item.apr))}`,
                subItems,
            };
        }

        return null;
    }
}

export const yearnVaultService = new YearnVaultService();
