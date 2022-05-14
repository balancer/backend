import { GqlBalancePoolAprItem, GqlBalancePoolAprSubItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import { getContractAt } from '../ethers/ethers';
import TarotBoostedAbi from './abi/TarotBoostedAbi.json';
import { tokenPriceService } from '../token-price/token-price.service';
import { TokenPrices } from '../token-price/token-price-types';
import _ from 'lodash';
import { BigNumber } from 'bignumber.js';

const TAROT_CACHE_KEY = 'tarot';

interface TarotData {
    address: string;
    apr: number;
}

const TAROT_APR_CONTRACT_ADDRESS = '0xc32B9a98F2419544070E9580166C5A18Af8ADf9f';
const tarotAPRContract = getContractAt(TAROT_APR_CONTRACT_ADDRESS, TarotBoostedAbi);

export class TarotService {
    private cache: CacheClass<string, TarotData[]>;
    private boostedPools = [
        {
            address: '0xfB98B335551a418cD0737375a2ea0ded62Ea213b', // MAI
            vault: '0x80D7413331AfB37B30BC0eF6AE9d11A40bcf014B', // tMAI
        },
    ];

    constructor() {
        this.cache = new Cache<string, TarotData[]>();
    }

    public async cacheTarotData(): Promise<void> {
        let data: TarotData[] = [];

        for (const pool of this.boostedPools) {
            const apr = await tarotAPRContract.callStatic.getAPREstimate(pool.vault);

            // 28842190275744000 -> 0.028842190275744
            const aprToBN = new BigNumber(apr.toString());
            const aprToFloat = parseFloat(aprToBN.shiftedBy(-18).toString());

            data.push({
                address: pool.address,
                apr: aprToFloat,
            });
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
