import { balancerService } from '../balancer-subgraph/balancer.service';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import {
    BalancerJoinExitFragment,
    BalancerPoolFragment,
    BalancerPoolTokenFragment,
    BalancerUserFragment,
    InvestType,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { FarmUserFragment } from '../masterchef-subgraph/generated/masterchef-subgraph-types';
import { BigNumber } from 'ethers';
import { fromFp } from '../util/numbers';
import _ from 'lodash';
import { TokenPrices } from '../token-price/token-price-types';
import { tokenPriceService } from '../token-price/token-price.service';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { UserPoolData, UserPortfolioData, UserTokenData } from './portfolio-types';
import moment from 'moment-timezone';

class PortfolioService {
    constructor() {}

    public async getPortfolio(address: string): Promise<UserPortfolioData> {
        const { user } = await balancerService.getUser({ id: address });
        const pools = await balancerService.getAllPools({ where: { totalShares_gt: '0' } });
        const farmUsers = await masterchefService.getAllFarmUsers({ where: { address } });
        const tokenPrices = await tokenPriceService.getTokenPrices();
        const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
        const { pools: previousPools } = await balancerService.getPools({
            first: 1000,
            where: { totalShares_gt: '0' },
            block: { number: parseInt(previousBlock.number) },
        });

        if (!user) {
            return { pools: [], tokens: [], totalValue: 0, totalFees: 0, totalVolume: 0, timestamp: 0, myFees: 0 };
        }

        const poolData = this.getUserPoolData(user, pools, previousPools, farmUsers, tokenPrices);
        const tokens = this.tokensFromUserPoolData(poolData);

        return {
            pools: poolData,
            tokens,
            timestamp: moment().unix(),
            totalValue: _.sumBy(poolData, 'totalPrice'),
            totalFees: _.sumBy(poolData, 'swapFees'),
            totalVolume: _.sumBy(poolData, 'swapVolume'),
            myFees: _.sumBy(poolData, 'myFees'),
        };
    }

    public async getPortfolioHistory(address: string) {
        const historicalTokenPrices = await tokenPriceService.getHistoricalTokenPrices();
        const blocks = await blocksSubgraphService.getDailyBlocks(8);
        const portfolioHistories: UserPortfolioData[] = [];

        for (let i = 0; i < blocks.length - 1; i++) {
            const block = blocks[i];
            const previousBlock = blocks[i + 1];
            const blockNumber = parseInt(block.number);

            const tokenPrices = tokenPriceService.getTokenPricesForTimestamp(block.timestamp, historicalTokenPrices);
            const user = await balancerService.getUserAtBlock(address, blockNumber);
            const allFarmUsers = await masterchefService.getAllFarmUsersAtBlock(blockNumber);
            const pools = await balancerService.getAllPoolsAtBlock(blockNumber);
            const previousPools = await balancerService.getAllPoolsAtBlock(parseInt(previousBlock.number));
            const allJoinExits = await balancerService.getAllJoinExitsAtBlock(blockNumber);

            if (user) {
                const farmUsers = allFarmUsers.filter((famUser) => famUser.address === user.id);
                const poolData = this.getUserPoolData(user, pools, previousPools, farmUsers, tokenPrices);
                const tokens = this.tokensFromUserPoolData(poolData);
                const joinExits = allJoinExits.filter((joinExit) => joinExit.user.id === user.id);
                const summedJoinExits = this.sumJoinExits(joinExits, tokenPrices);

                portfolioHistories.push({
                    tokens,
                    pools: poolData,
                    timestamp: parseInt(block.timestamp),
                    totalValue: _.sumBy(poolData, 'totalPrice'),
                    totalFees: _.sumBy(poolData, 'swapFees'),
                    totalVolume: _.sumBy(poolData, 'swapVolume'),
                    myFees: _.sumBy(poolData, 'myFees'),
                });
            }
        }

        console.log(JSON.stringify(portfolioHistories, null, 4));
    }

    public getUserPoolData(
        balancerUser: BalancerUserFragment,
        pools: BalancerPoolFragment[],
        previousPools: BalancerPoolFragment[],
        userFarms: FarmUserFragment[],
        tokenPrices: TokenPrices,
    ): UserPoolData[] {
        const userPoolData = pools
            .map((pool) => {
                const sharesOwned = balancerUser.sharesOwned?.find((shares) => shares.poolId.id === pool.id);
                const userFarm = userFarms.find((userFarm) => userFarm.pool?.pair === pool.address);
                const shares =
                    parseFloat(sharesOwned?.balance || '0') + fromFp(BigNumber.from(userFarm?.amount || 0)).toNumber();
                const totalShares = parseFloat(pool.totalShares);
                const percentShare = shares / totalShares;
                const tokens = _.orderBy(
                    (pool.tokens || []).map((token) =>
                        this.mapPoolTokenToUserPoolTokenData(token, percentShare, tokenPrices),
                    ),
                    'totalPrice',
                    'desc',
                );
                const totalPrice = _.sumBy(tokens, (token) => token.totalPrice);
                const previousPool = previousPools.find((previousPool) => previousPool.id === pool.id);
                const previousTotalPrice = _.sumBy(
                    (previousPool?.tokens || []).map((token) =>
                        this.mapPoolTokenToUserPoolTokenData(token, percentShare, tokenPrices),
                    ),
                    'totalPrice',
                );

                const swapFees = parseFloat(pool.totalSwapFee) - parseFloat(previousPool?.totalSwapFee || '0');

                return {
                    id: pool.id,
                    poolId: pool.id,
                    poolAddress: pool.address,
                    name: pool.name || '',
                    shares,
                    percentShare,
                    totalPrice,
                    pricePerShare: totalPrice / shares,
                    tokens: tokens.map((token) => ({
                        ...token,
                        percentOfPortfolio: token.totalPrice / totalPrice,
                    })),
                    swapFees,
                    swapVolume: parseFloat(pool.totalSwapVolume) - parseFloat(previousPool?.totalSwapVolume || '0'),
                    myFees: swapFees * percentShare,
                    priceChange: totalPrice - previousTotalPrice,
                    priceChangePercent: (totalPrice - previousTotalPrice) / previousTotalPrice,
                };
            })
            .filter((item) => item.shares > 0);

        const totalValue = _.sumBy(userPoolData, 'totalPrice');

        return _.orderBy(userPoolData, 'totalPrice', 'desc').map((pool) => ({
            ...pool,
            percentOfPortfolio: pool.totalPrice / totalValue,
        }));
    }

    private mapPoolTokenToUserPoolTokenData(
        token: BalancerPoolTokenFragment,
        percentShare: number,
        tokenPrices: TokenPrices,
    ): Omit<UserTokenData, 'percentOfPortfolio'> {
        const pricePerToken = tokenPrices[token.address.toLowerCase()]?.usd || 0;
        const balance = parseFloat(token.balance) * percentShare;

        return {
            id: token.id,
            address: token.address || '',
            symbol: token.symbol || '',
            name: token.name || '',
            pricePerToken,
            balance,
            totalPrice: pricePerToken * balance,
        };
    }

    private tokensFromUserPoolData(data: UserPoolData[]): UserTokenData[] {
        const allTokens = _.flatten(data.map((item) => item.tokens));
        const groupedTokens = _.groupBy(allTokens, 'symbol');

        const tokens = _.map(groupedTokens, (group) => ({
            ...group[0],
            balance: _.sumBy(group, (token) => token.balance),
            totalPrice: _.sumBy(group, (token) => token.totalPrice),
        }));

        return _.orderBy(tokens, 'totalPrice', 'desc');
    }

    private sumJoinExits(
        joinExits: BalancerJoinExitFragment[],
        tokenPrices: TokenPrices,
    ): { token: string; balance: number; totalValue: number }[] {
        const tokensWithAmounts = _.flatten(
            joinExits.map((joinExit) =>
                joinExit.amounts.map((amount, idx) => ({
                    amount,
                    token: joinExit.pool.tokensList[idx],
                    type: joinExit.type,
                })),
            ),
        );

        const grouped = _.groupBy(tokensWithAmounts, 'token');

        return _.map(grouped, (token, address) => {
            const balance = _.sumBy(
                token,
                (item) => parseFloat(item.amount) * (item.type === InvestType.Exit ? -1 : 1),
            );
            const pricePerToken = tokenPrices[address.toLowerCase()]?.usd || 0;

            return {
                token: address,
                balance,
                totalValue: balance * pricePerToken,
            };
        });
    }
}

export const portfolioService = new PortfolioService();
