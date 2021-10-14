import { balancerService } from '../balancer-subgraph/balancer.service';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import {
    BalancerPoolFragment,
    BalancerPoolTokenFragment,
    BalancerUserFragment,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { FarmUserFragment } from '../masterchef-subgraph/generated/masterchef-subgraph-types';
import { BigNumber } from 'ethers';
import { fromFp } from '../util/numbers';
import _ from 'lodash';
import { TokenPrices } from '../token-price/token-price-types';
import { tokenPriceService } from '../token-price/token-price.service';

class PortfolioService {
    constructor() {}

    public async getPortfolio(address: string) {
        const { user } = await balancerService.getUser({ id: address });
        const { pools } = await balancerService.getPools({ first: 1000, where: { totalShares_gt: '0' } });
        const { farmUsers } = await masterchefService.getFarmUsers({ first: 1000, where: { address } });
        const tokenPrices = await tokenPriceService.getTokenPrices();

        if (!user) {
            return null;
        }

        const poolData = this.getUserPoolData(user, pools, farmUsers, tokenPrices);
        const assets = this.assetsFromUserPoolData(poolData);
    }

    public async getPortfolioHistory(address: string) {
        /*await balancerService.getHistoricalTokenPrices({
            address: '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e',
            days: 7,
        });*/

        await tokenPriceService.cacheHistoricalTokenPrices();

        /*const { user } = await balancerService.getUser({ id: address });
        const { pools } = await balancerService.getPools({ first: 1000, where: { totalShares_gt: '0' } });
        const { farmUsers } = await masterchefService.getFarmUsers({ first: 1000, where: { address } });
        const { farms } = await masterchefService.getFarms({ first: 1000 });
        const tokenAddresses = balancerService.getUniqueTokenAddressesFromPools(pools);

        const historicalPrices = await coingeckoService.getTokenHistoricalPrices(
            [tokenAddresses[0], tokenAddresses[1]],
            30,
        );

        console.log('historical prices', JSON.stringify(historicalPrices, null, 4));
        console.log('count', Object.keys(historicalPrices).length);*/
    }

    private getUserPoolData(
        balancerUser: BalancerUserFragment,
        pools: BalancerPoolFragment[],
        userFarms: FarmUserFragment[],
        tokenPrices: TokenPrices,
    ): UserPoolData[] {
        return pools
            .map((pool) => {
                const sharesOwned = balancerUser.sharesOwned?.find((shares) => shares.poolId.id === pool.id);
                const userFarm = userFarms.find((userFarm) => userFarm.pool?.pair === pool.address);
                const shares = fromFp(
                    BigNumber.from(sharesOwned?.balance || 0).add(BigNumber.from(userFarm?.amount || 0)),
                ).toNumber();
                const totalShares = parseFloat(pool.totalShares);
                const percentShare = shares / totalShares;

                const tokens = (pool.tokens || []).map((token) =>
                    this.mapPoolTokenToUserPoolTokenData(token, percentShare, tokenPrices),
                );

                return {
                    poolId: pool.id,
                    poolAddress: pool.address,
                    shares,
                    percentShare,
                    value: _.sumBy(tokens, (token) => token.value),
                    tokens,
                };
            })
            .filter((item) => item.shares > 0);
    }

    private mapPoolTokenToUserPoolTokenData(
        token: BalancerPoolTokenFragment,
        percentShare: number,
        tokenPrices: TokenPrices,
    ): UserTokenData {
        const price = tokenPrices[token.address.toLowerCase()]?.usd || 0;
        const balance = parseFloat(token.balance) * percentShare;

        return {
            address: token.address || '',
            symbol: token.symbol || '',
            name: token.name || '',
            price,
            balance,
            value: price * balance,
        };
    }

    private assetsFromUserPoolData(data: UserPoolData[]): UserTokenData[] {
        const allTokens = _.flatten(data.map((item) => item.tokens));
        const groupedTokens = _.groupBy(allTokens, 'symbol');

        return _.map(groupedTokens, (group) => ({
            ...group[0],
            balance: _.sumBy(group, (token) => token.balance),
            value: _.sumBy(group, (token) => token.value),
        }));
    }
}

export const portfolioService = new PortfolioService();
