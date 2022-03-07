import axios from 'axios';
import { GqlBalancePoolAprItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import _ from 'lodash';
import moment from 'moment-timezone';
import { getContractAt } from '../ethers/ethers';
import BooTokenAbi from './abi/BooTokenAbi.json';
import { formatFixed } from '@ethersproject/bignumber';
import { tokenPriceService } from '../token-price/token-price.service';
import { TokenPrices } from '../token-price/token-price-types';

const SPOOKY_SWAP_CACHE_KEY = 'spooky-swap';

interface SpookySwapData {
    xBooApr: number;
}

const BOO_TOKEN_ADDRESS = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';
const XBOO_TOKEN_ADDRESS = '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598';
const booTokenContract = getContractAt(BOO_TOKEN_ADDRESS, BooTokenAbi);

export class SpookySwapService {
    private cache: CacheClass<string, SpookySwapData>;

    constructor() {
        this.cache = new Cache<string, SpookySwapData>();
    }

    public async cacheSpookySwapData(): Promise<void> {
        const { data } = await axios.get<string>('https://api.spookyswap.finance/api/xboo', {});

        this.cache.put(SPOOKY_SWAP_CACHE_KEY, { xBooApr: parseFloat(data) }, 120000);
    }

    public getSpookySwapData(): SpookySwapData {
        const cached = this.cache.get(SPOOKY_SWAP_CACHE_KEY);

        return cached || { xBooApr: 0 };
    }

    public getAprItemForBoostedPool(pool: GqlBalancerPool, tokenPrices: TokenPrices): GqlBalancePoolAprItem | null {
        for (const linearPool of pool.linearPools || []) {
            if (linearPool.mainToken.address.toLowerCase() === BOO_TOKEN_ADDRESS.toLowerCase()) {
                const poolToken = pool.tokens.find((token) => token.address === linearPool.address);
                const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, linearPool.mainToken.address);
                const spookySwapData = this.getSpookySwapData();
                const mainTokens = parseFloat(linearPool.mainToken.balance);
                const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
                const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
                const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);
                const booLiquidity = mainTokens * tokenPrice + wrappedTokens * priceRate * tokenPrice;
                const poolBooLiquidity =
                    (parseFloat(poolToken?.balance || '0') / parseFloat(linearPool.totalSupply)) * booLiquidity;
                const poolWrappedLiquidity = poolBooLiquidity * percentWrapped;

                return {
                    title: 'xBOO boosted APR',
                    apr: `${spookySwapData.xBooApr * (poolWrappedLiquidity / parseFloat(pool.totalLiquidity))}`,
                };
            }
        }

        return null;
    }
}

export const spookySwapService = new SpookySwapService();
