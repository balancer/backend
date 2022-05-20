import { GqlBalancePoolAprItem, GqlBalancePoolAprSubItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import { getContractAt } from '../ethers/ethers';
import TarotBoostedAbi from './abi/TarotBoostedAbi.json';
import { tokenPriceService } from '../token-price/token-price.service';
import { TokenPrices } from '../token-price/token-price-types';
import _ from 'lodash';
import { formatFixed } from '@ethersproject/bignumber';
import { balancerSdk } from '../balancer-sdk/src/balancer-sdk';

const TAROT_CACHE_KEY = 'tarot';

interface TarotData {
    mainToken: string;
    apr: number;
}

const TAROT_APR_CONTRACT_ADDRESS = '0xc32B9a98F2419544070E9580166C5A18Af8ADf9f';
const tarotAPRContract = getContractAt(TAROT_APR_CONTRACT_ADDRESS, TarotBoostedAbi);
const TAROT_FACTORY_ADDRESS = balancerSdk.networkConfig.addresses.linearFactories;

export class TarotService {
    private cache: CacheClass<string, TarotData[]>;

    constructor() {
        this.cache = new Cache<string, TarotData[]>();
    }

    public async cacheTarotData(pools: GqlBalancerPool[]): Promise<void> {
        let data: TarotData[] = [];
        const tarotFactoryAddress = TAROT_FACTORY_ADDRESS
            ? Object.keys(TAROT_FACTORY_ADDRESS).filter(function (key) {
                  return TAROT_FACTORY_ADDRESS[key] === 'tarot';
              })[0]
            : '';

        for (const pool of pools) {
            if (pool && pool.factory === tarotFactoryAddress && pool.wrappedIndex) {
                const apr = await tarotAPRContract.callStatic.getAPREstimate(
                    pool.tokens[pool.wrappedIndex || 0].address,
                );

                data.push({
                    mainToken: pool.tokens[pool.mainIndex || 0].address,
                    apr: parseFloat(formatFixed(apr, 18)),
                });
            }
        }

        this.cache.put(TAROT_CACHE_KEY, data, 120000);
    }

    public getTarotData(): TarotData[] {
        const cached = this.cache.get(TAROT_CACHE_KEY);

        return cached || [];
    }

    public getAprItemForBoostedPool(pool: GqlBalancerPool, tokenPrices: TokenPrices): GqlBalancePoolAprItem | null {
        const subItems: GqlBalancePoolAprSubItem[] = [];
        const boostedPools = this.getTarotData();

        for (const linearPool of pool.linearPools || []) {
            const boostedPool = boostedPools.find(
                (boostedPool) => boostedPool.mainToken.toLowerCase() === linearPool.mainToken.address.toLowerCase(),
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
        }

        if (subItems.length > 0) {
            return {
                title: 'Tarot boosted APR',
                apr: `${_.sumBy(subItems, (item) => parseFloat(item.apr))}`,
                subItems,
            };
        }

        return null;
    }
}

export const tarotService = new TarotService();
