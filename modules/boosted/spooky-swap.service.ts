import axios from 'axios';
import { GqlBalancePoolAprItem, GqlBalancerPool } from '../../schema';
import { Cache, CacheClass } from 'memory-cache';
import _ from 'lodash';
import moment from 'moment-timezone';
import { getContractAt } from '../ethers/ethers';
import BooTokenAbi from './abi/BooTokenAbi.json';
import { formatFixed } from '@ethersproject/bignumber';
import { tokenPriceService } from '../token-price/token-price.service';

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
        const startTime = moment.tz('GMT').startOf('day').subtract(8, 'days').unix();

        const { data } = await axios.post<{
            data: { uniswapDayDatas: { id: string; date: number; dailyVolumeUSD: string }[] };
        }>('https://api.thegraph.com/subgraphs/name/eerieeight/spookyswap', {
            operationName: 'uniswapDayDatas',
            query: `query uniswapDayDatas($startTime: Int!) {
                uniswapDayDatas(first: 8, where: {date_gt: $startTime}, orderBy: date, orderDirection: asc) {
                    id
                    date
                    dailyVolumeUSD
                }
            }`,
            variables: { startTime },
        });

        const timeElapsedToday = moment.tz('GMT').unix() - moment.tz('GMT').startOf('day').unix();
        const percentElapsedToday = timeElapsedToday / 86400;
        const sevenDayVolume = _.sum(
            data.data.uniswapDayDatas.map((item, index) => {
                if (index === 0) {
                    return percentElapsedToday === 1 ? 0 : parseFloat(item.dailyVolumeUSD) * (1 - percentElapsedToday);
                }

                return parseFloat(item.dailyVolumeUSD);
            }),
        );

        const tokenPrices = await tokenPriceService.getTokenPrices();
        const booPrice = tokenPriceService.getPriceForToken(tokenPrices, BOO_TOKEN_ADDRESS);
        const feeYearly = sevenDayVolume * 0.0003 * (365 / 7);
        const booStakedBigNumber = await booTokenContract.balanceOf(XBOO_TOKEN_ADDRESS);
        const booStaked = parseFloat(formatFixed(booStakedBigNumber.toString(), 18));
        const xBooTvl = booStaked * booPrice;

        this.cache.put(SPOOKY_SWAP_CACHE_KEY, { xBooApr: feeYearly / xBooTvl }, 120000);
    }

    public getSpookySwapData(): SpookySwapData {
        const cached = this.cache.get(SPOOKY_SWAP_CACHE_KEY);

        return cached || { xBooApr: 0 };
    }

    public getAprItemForBoostedPool(pool: GqlBalancerPool): GqlBalancePoolAprItem | null {
        for (const linearPool of pool.linearPools || []) {
            if (linearPool.mainToken.address.toLowerCase() === BOO_TOKEN_ADDRESS.toLowerCase()) {
                const spookySwapData = this.getSpookySwapData();
                const mainTokens = parseFloat(linearPool.mainToken.balance);
                const wrappedTokens = parseFloat(linearPool.wrappedToken.balance);
                const priceRate = parseFloat(linearPool.wrappedToken.priceRate);
                const percentWrapped = (wrappedTokens * priceRate) / (mainTokens + wrappedTokens * priceRate);

                return {
                    title: 'xBOO boosted APR',
                    apr: `${spookySwapData.xBooApr * percentWrapped}`,
                };
            }
        }

        return null;
    }
}

export const spookySwapService = new SpookySwapService();
