import { Price, TokenHistoricalPrices, TokenPrices } from './token-price-types';
import { coingeckoService } from '../../modules/coingecko/coingecko.service';
import { balancerPriceService } from './lib/balancer-price.service';
import { sleep } from '../../modules/common/promise';
import _ from 'lodash';
import { Cache, CacheClass } from 'memory-cache';

import { getAddress } from 'ethers/lib/utils';
import { balancerSubgraphService } from '../../modules/subgraphs/balancer-subgraph/balancer-subgraph.service';
import { beetsBarService } from '../../modules/subgraphs/beets-bar-subgraph/beets-bar.service';
import { formatFixed } from '@ethersproject/bignumber';
import { BalancerPoolFragment } from '../../modules/subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { blocksSubgraphService } from '../../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { SFTMX_ADDRESS, staderStakedFtmService } from './lib/stader-staked-ftm.service';
import { getContractAt } from '../../modules/web3/contract';
import { networkConfig } from '../../modules/config/network-config';

const TOKEN_PRICES_CACHE_KEY = 'token-prices';
const TOKEN_HISTORICAL_PRICES_CACHE_KEY = 'token-historical-prices';
const NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY = 'nested-bpt-historical-prices';
const BEETS_PRICE_CACHE_KEY = 'token-prices:beets-price';
const FBEETS_PRICE_CACHE_KEY = 'token-prices:fbeets-price';

export class TokenPriceService {
    cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getTokenPrices(): Promise<TokenPrices> {
        const memCached = this.cache.get(TOKEN_PRICES_CACHE_KEY) as TokenPrices | null;

        if (memCached) {
            return memCached;
        }

        const tokenPrices: TokenPrices = await this.cache.get(TOKEN_PRICES_CACHE_KEY);

        if (tokenPrices) {
            this.cache.put(TOKEN_PRICES_CACHE_KEY, tokenPrices, 5000);
        }

        return tokenPrices || {};
    }

    public async getHistoricalTokenPrices(): Promise<TokenHistoricalPrices> {
        const memCached = this.cache.get(TOKEN_HISTORICAL_PRICES_CACHE_KEY) as TokenHistoricalPrices | null;

        if (memCached) {
            return memCached;
        }

        const tokenPrices: TokenHistoricalPrices = await this.cache.get(TOKEN_HISTORICAL_PRICES_CACHE_KEY);
        const nestedBptPrices: TokenHistoricalPrices = await this.cache.get(NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY);

        if (tokenPrices) {
            this.cache.put(TOKEN_HISTORICAL_PRICES_CACHE_KEY, { ...tokenPrices, ...nestedBptPrices }, 60000);
        }

        //don't try to refetch the cache, it takes way too long
        return { ...tokenPrices, ...nestedBptPrices };
    }

    public getTokenPricesForTimestamp(timestamp: number, tokenHistoricalPrices: TokenHistoricalPrices): TokenPrices {
        const msTimestamp = timestamp * 1000;
        return _.mapValues(tokenHistoricalPrices, (tokenPrices) => {
            if (tokenPrices.length === 0) {
                return { usd: 0 };
            }

            const closest = tokenPrices.reduce((a, b) => {
                return Math.abs(b.timestamp - msTimestamp) < Math.abs(a.timestamp - msTimestamp) ? b : a;
            });

            return { usd: closest.price };
        });
    }

    public async cacheTokenPrices(): Promise<void> {
        const pools = await balancerSubgraphService.getAllPools({});
        //TODO: if we get to a point where we support more than 1000 tokens, we need to paginate this better
        const { tokenAddresses, nestedBptAddresses } = await this.getTokenAddresses(pools);
        let coingeckoTokenPrices: TokenPrices = {};
        let nativeAssetPrice: Price | null = null;

        try {
            nativeAssetPrice = await coingeckoService.getNativeAssetPrice();
            //rate limiting happens quite often, we try to handle it gracefully below
            coingeckoTokenPrices = await coingeckoService.getTokenPrices(tokenAddresses);
        } catch {}

        if (!nativeAssetPrice) {
            throw new Error('no native asset price');
        }

        const missingTokens = tokenAddresses.filter((token) => {
            const tokenPrice =
                coingeckoTokenPrices[token] ||
                coingeckoTokenPrices[getAddress(token)] ||
                coingeckoTokenPrices[token.toLowerCase()];

            return !tokenPrice || !tokenPrice.usd;
        });

        const balancerTokenPrices = await balancerPriceService.getTokenPrices(
            [...missingTokens, networkConfig.chain.wrappedNativeAssetAddress],
            coingeckoTokenPrices,
        );

        const nestedBptPrices = await this.getNestedBptPrices(nestedBptAddresses, pools, {
            ...coingeckoTokenPrices,
            ...balancerTokenPrices,
        });

        const stakedFtmPrice = await staderStakedFtmService.getStakedFtmPrice(nativeAssetPrice.usd);

        const tokenPrices = {
            ...coingeckoTokenPrices,
            ...balancerTokenPrices,
            ...nestedBptPrices,
            [networkConfig.chain.nativeAssetAddress]: nativeAssetPrice,
            //stader ftmx
            [SFTMX_ADDRESS]: stakedFtmPrice,
        };

        const cached: TokenPrices = await this.cache.get(TOKEN_PRICES_CACHE_KEY);
        const coingeckoRequestSuccessful = Object.keys(coingeckoTokenPrices).length > 0;

        //recache if the coingecko request was successful, or if there are no cached token prices
        if (coingeckoRequestSuccessful || cached === null) {
            await this.cache.put(TOKEN_PRICES_CACHE_KEY, tokenPrices, 30);
        }
    }

    public async cacheHistoricalTokenPrices(): Promise<TokenHistoricalPrices> {
        const pools = await balancerSubgraphService.getAllPools({});
        const { tokenAddresses } = await this.getTokenAddresses(pools);
        const missingTokens: string[] = [];
        const tokenPrices: TokenHistoricalPrices = {};
        const cached = await this.getHistoricalTokenPrices();

        for (const token of tokenAddresses) {
            try {
                tokenPrices[token] = await coingeckoService.getTokenHistoricalPrices(token, 30);
            } catch {
                missingTokens.push(token);
            }

            //coingecko rate limit is 10 requests per seconds, be generous here so we don't get rate limited
            await sleep(150);
        }

        //pre-emptively cache whatever we got from coingecko
        await this.cache.put(TOKEN_HISTORICAL_PRICES_CACHE_KEY, { ...cached, ...tokenPrices });

        for (const token of [...missingTokens]) {
            tokenPrices[token] = await balancerPriceService.getHistoricalTokenPrices({
                address: token,
                days: 30,
                coingeckoHistoricalPrices: tokenPrices,
            });
        }
        await this.cache.put(TOKEN_HISTORICAL_PRICES_CACHE_KEY, tokenPrices);

        return tokenPrices;
    }

    public async cacheHistoricalNestedBptPrices() {
        const pools = await balancerSubgraphService.getAllPools({});
        const { nestedBptAddresses } = await this.getTokenAddresses(pools);
        const historicalTokenPrices: TokenHistoricalPrices = await this.cache.get(TOKEN_HISTORICAL_PRICES_CACHE_KEY);

        if (!historicalTokenPrices) {
            return;
        }

        const nestedBptHistoricalPrices: TokenHistoricalPrices = {};

        const blocks = await blocksSubgraphService.getDailyBlocks(30);

        for (const block of blocks) {
            const timestamp = parseInt(block.timestamp);
            const poolsAtBlock = await balancerSubgraphService.getAllPoolsAtBlock(parseInt(block.number));
            const tokenPricesAtBlock = this.getTokenPricesForTimestamp(timestamp, historicalTokenPrices);
            const nestedBptPrices = await this.getNestedBptPrices(nestedBptAddresses, poolsAtBlock, tokenPricesAtBlock);

            for (const nestedBpt of nestedBptAddresses) {
                if (!nestedBptHistoricalPrices[nestedBpt]) {
                    nestedBptHistoricalPrices[nestedBpt] = [];
                }

                if (nestedBptPrices[nestedBpt]) {
                    nestedBptHistoricalPrices[nestedBpt].push({
                        timestamp: timestamp * 1000,
                        price: nestedBptPrices[nestedBpt].usd,
                    });
                }
            }
        }

        await this.cache.put(NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY, nestedBptHistoricalPrices);
    }

    public getPriceForToken(tokenPrices: TokenPrices, address: string): number {
        return (
            tokenPrices[address]?.usd ||
            tokenPrices[getAddress(address)]?.usd ||
            tokenPrices[address.toLowerCase()]?.usd ||
            0
        );
    }

    public async getBeetsPrice(): Promise<{
        beetsPrice: number;
        fbeetsPrice: number;
    }> {
        const beetsPrice: string | undefined = await this.cache.get(BEETS_PRICE_CACHE_KEY);
        const fbeetsPrice: string | undefined = await this.cache.get(FBEETS_PRICE_CACHE_KEY);

        if (!beetsPrice || !fbeetsPrice) {
            throw new Error('did not find price for beets');
        }

        return {
            beetsPrice: parseFloat(beetsPrice),
            fbeetsPrice: parseFloat(fbeetsPrice),
        };
    }

    public async cacheBeetsPrice() {
        const { pool: beetsUsdcPool } = await balancerSubgraphService.getPool({
            id: '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
        });

        const beets = (beetsUsdcPool?.tokens ?? []).find((token) => token.address === networkConfig.beets.address);
        const usdc = (beetsUsdcPool?.tokens ?? []).find((token) => token.address !== networkConfig.beets.address);

        const { pool: beetsFtmPool } = await balancerSubgraphService.getPool({
            id: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
        });

        if (!beets || !usdc || !beetsFtmPool) {
            throw new Error('did not find price for beets');
        }

        const bptPrice = parseFloat(beetsFtmPool.totalLiquidity) / parseFloat(beetsFtmPool.totalShares);
        const beetsBar = await beetsBarService.getBeetsBarNow();
        const fbeetsPrice = bptPrice * parseFloat(beetsBar.ratio);

        const beetsPrice =
            ((parseFloat(beets.weight || '0') / parseFloat(usdc.weight || '1')) * parseFloat(usdc.balance)) /
            parseFloat(beets.balance);

        await this.cache.put(BEETS_PRICE_CACHE_KEY, `${beetsPrice}`, 30);
        await this.cache.put(FBEETS_PRICE_CACHE_KEY, `${fbeetsPrice}`, 30);
    }

    public async getTokenAddresses(
        pools: BalancerPoolFragment[],
    ): Promise<{ tokenAddresses: string[]; nestedBptAddresses: string[] }> {
        const allTokens = _.uniq(_.flatten(pools.map((pool) => (pool.tokens || []).map((token) => token.address))));
        const nestedBptAddresses = allTokens.filter((token) => this.isTokenNestedBpt(token, pools));
        const tokenAddresses = allTokens.filter((token) => !nestedBptAddresses.includes(token));

        return { tokenAddresses, nestedBptAddresses };
    }

    private isTokenNestedBpt(token: string, pools: BalancerPoolFragment[]): boolean {
        return !!pools.find((pool) => token === pool.address);
    }

    public async getNestedBptPrices(
        nestedBptAddresses: string[],
        pools: BalancerPoolFragment[],
        tokenPrices: TokenPrices,
    ): Promise<TokenPrices> {
        const nestedBptTokenPrices: TokenPrices = {};

        for (const nestedBptAddress of nestedBptAddresses) {
            const pool = pools.find((pool) => pool.address === nestedBptAddress);

            if (pool?.poolType === 'Linear') {
                const linearPool = getContractAt(pool.address, []);
                const rate = await linearPool.getRate();
                const formattedRate = formatFixed(rate, 18);
                const mainTokenPrice = this.getPriceForToken(tokenPrices, pool.tokensList[pool.mainIndex || 0]);

                nestedBptTokenPrices[nestedBptAddress] = {
                    usd: parseFloat(formattedRate) * mainTokenPrice,
                };

                if (mainTokenPrice && pool.wrappedIndex && pool.tokensList[pool.wrappedIndex]) {
                    const wrappedToken = pool.tokensList[pool.wrappedIndex];
                    const wrappedRate = await linearPool.getWrappedTokenRate();
                    const formattedWrappedRate = formatFixed(wrappedRate, 18);

                    nestedBptTokenPrices[wrappedToken] = {
                        usd: parseFloat(formattedWrappedRate) * mainTokenPrice,
                    };
                }
            }
        }

        for (const nestedBptAddress of nestedBptAddresses) {
            const pool = pools.find((pool) => pool.address === nestedBptAddress);

            //TODO: chance this can fail for stable phantom nested in stable phantom, depending on ordering
            if (pool?.poolType === 'StablePhantom') {
                const totalLiquidity = _.sum(
                    pool.tokens?.map((token) => {
                        const tokenPrice =
                            this.getPriceForToken(tokenPrices, token.address) ||
                            nestedBptTokenPrices[token.address]?.usd ||
                            0;

                        return parseFloat(token.balance) * tokenPrice;
                    }),
                );

                if (totalLiquidity > 0 && parseFloat(pool.totalShares) > 0) {
                    nestedBptTokenPrices[nestedBptAddress] = {
                        usd: totalLiquidity / parseFloat(pool.totalShares),
                    };
                }
            }
        }

        return nestedBptTokenPrices;
    }
}

export const tokenPriceService = new TokenPriceService();
