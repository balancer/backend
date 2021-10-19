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
import { GqlUserPortfolioData, GqlUserTokenData } from '../../schema';

class PortfolioService {
    constructor() {}

    public async getPortfolio(address: string): Promise<UserPortfolioData> {
        const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
        const { user } = await balancerService.getUser({ id: address });
        const pools = await balancerService.getAllPools({ where: { totalShares_gt: '0' } });
        const farmUsers = await masterchefService.getAllFarmUsers({ where: { address } });
        const tokenPrices = await tokenPriceService.getTokenPrices();
        const { pools: previousPools } = await balancerService.getPools({
            first: 1000,
            where: { totalShares_gt: '0' },
            block: { number: parseInt(previousBlock.number) },
        });
        const previousFarmUsers = await masterchefService.getAllFarmUsers({
            where: { address },
            block: { number: parseInt(previousBlock.number) },
        });
        const { user: previousUser } = await balancerService.getUser({
            id: address,
            block: { number: parseInt(previousBlock.number) },
        });
        const historicalTokenPrices = await tokenPriceService.getHistoricalTokenPrices();
        const previousTokenPrices = tokenPriceService.getTokenPricesForTimestamp(
            previousBlock.timestamp,
            historicalTokenPrices,
        );

        if (!user || !previousUser) {
            return {
                pools: [],
                tokens: [],
                totalValue: 0,
                totalSwapFees: 0,
                totalSwapVolume: 0,
                timestamp: 0,
                myFees: 0,
            };
        }

        const poolData = this.getUserPoolData(
            user,
            previousUser,
            pools,
            previousPools,
            farmUsers,
            previousFarmUsers,
            tokenPrices,
            previousTokenPrices,
        );
        const tokens = this.tokensFromUserPoolData(poolData);

        return {
            pools: poolData,
            tokens,
            timestamp: moment().unix(),
            totalValue: _.sumBy(poolData, 'totalValue'),
            totalSwapFees: _.sumBy(poolData, 'swapFees'),
            totalSwapVolume: _.sumBy(poolData, 'swapVolume'),
            myFees: _.sumBy(poolData, 'myFees'),
        };
    }

    public async getPortfolioHistory(address: string): Promise<UserPortfolioData[]> {
        const historicalTokenPrices = await tokenPriceService.getHistoricalTokenPrices();
        const blocks = await blocksSubgraphService.getDailyBlocks(30);
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
            const allPreviousFarmUsers = await masterchefService.getAllFarmUsersAtBlock(parseInt(previousBlock.number));
            const previousUser = await balancerService.getUserAtBlock(address, parseInt(previousBlock.number));
            const previousTokenPrices = tokenPriceService.getTokenPricesForTimestamp(
                previousBlock.timestamp,
                historicalTokenPrices,
            );
            //const allJoinExits = await balancerService.getAllJoinExitsAtBlock(blockNumber);

            if (user && previousUser) {
                const farmUsers = allFarmUsers.filter((famUser) => famUser.address === user.id);
                const previousFarmUsers = allPreviousFarmUsers.filter((famUser) => famUser.address === user.id);
                const poolData = this.getUserPoolData(
                    user,
                    previousUser,
                    pools,
                    previousPools,
                    farmUsers,
                    previousFarmUsers,
                    tokenPrices,
                    previousTokenPrices,
                );
                const tokens = this.tokensFromUserPoolData(poolData);
                //const joinExits = allJoinExits.filter((joinExit) => joinExit.user.id === user.id);
                //const summedJoinExits = this.sumJoinExits(joinExits, tokenPrices);

                portfolioHistories.push({
                    tokens,
                    pools: poolData,
                    //this data represents the previous day
                    timestamp: moment.unix(parseInt(block.timestamp)).subtract(1, 'day').unix(),
                    totalValue: _.sumBy(poolData, 'totalValue'),
                    totalSwapFees: _.sumBy(poolData, 'swapFees'),
                    totalSwapVolume: _.sumBy(poolData, 'swapVolume'),
                    myFees: _.sumBy(poolData, 'myFees'),
                });
            }
        }

        return portfolioHistories;
    }

    public getUserPoolData(
        balancerUser: BalancerUserFragment,
        previousBalancerUser: BalancerUserFragment,
        pools: BalancerPoolFragment[],
        previousPools: BalancerPoolFragment[],
        userFarms: FarmUserFragment[],
        previousUserFarms: FarmUserFragment[],
        tokenPrices: TokenPrices,
        previousTokenPrices: TokenPrices,
    ): UserPoolData[] {
        const userPoolData: Omit<UserPoolData, 'percentOfPortfolio'>[] = [];

        for (const pool of pools) {
            const previousPool = previousPools.find((previousPool) => previousPool.id === pool.id);

            if (!previousPool) {
                continue;
            }

            const { userNumShares, userPercentShare, userTotalValue, userTokens, pricePerShare } =
                this.generatePoolIntermediates(pool, balancerUser, userFarms, tokenPrices);
            const previous = this.generatePoolIntermediates(
                previousPool,
                previousBalancerUser,
                previousUserFarms,
                previousTokenPrices,
            );

            const swapFees = parseFloat(pool.totalSwapFee) - parseFloat(previousPool.totalSwapFee);

            if (userNumShares > 0) {
                userPoolData.push({
                    id: pool.id,
                    poolId: pool.id,
                    poolAddress: pool.address,
                    name: pool.name || '',
                    shares: userNumShares,
                    percentShare: userPercentShare,
                    totalValue: userTotalValue,
                    pricePerShare: userTotalValue / userNumShares,
                    tokens: userTokens.map((token) => ({
                        ...token,
                        percentOfPortfolio: token.totalValue / userTotalValue,
                    })),
                    swapFees,
                    swapVolume: parseFloat(pool.totalSwapVolume) - parseFloat(previousPool.totalSwapVolume),
                    myFees: swapFees * userPercentShare,
                    priceChange:
                        pricePerShare && previous.pricePerShare
                            ? userNumShares * pricePerShare - userNumShares * previous.pricePerShare
                            : 0,
                    priceChangePercent:
                        pricePerShare && previous.pricePerShare
                            ? (pricePerShare - previous.pricePerShare) / pricePerShare
                            : 0,
                });
            }
        }

        const totalValue = _.sumBy(userPoolData, 'totalValue');

        return _.orderBy(userPoolData, 'totalValue', 'desc').map((pool) => ({
            ...pool,
            percentOfPortfolio: pool.totalValue / totalValue,
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
            totalValue: pricePerToken * balance,
        };
    }

    private tokensFromUserPoolData(data: UserPoolData[]): UserTokenData[] {
        const allTokens = _.flatten(data.map((item) => item.tokens));
        const groupedTokens = _.groupBy(allTokens, 'symbol');
        const poolsTotalValue = _.sumBy(data, 'totalValue');

        const tokens = _.map(groupedTokens, (group) => {
            const totalValue = _.sumBy(group, (token) => token.totalValue);

            return {
                ...group[0],
                balance: _.sumBy(group, (token) => token.balance),
                totalValue,
                percentOfPortfolio: totalValue / poolsTotalValue,
            };
        });

        return _.orderBy(tokens, 'totalValue', 'desc');
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

    private generatePoolIntermediates(
        pool: BalancerPoolFragment,
        balancerUser: BalancerUserFragment,
        userFarms: FarmUserFragment[],
        tokenPrices: TokenPrices,
    ) {
        const sharesOwned = balancerUser.sharesOwned?.find((shares) => shares.poolId.id === pool.id);
        const userFarm = userFarms.find((userFarm) => userFarm.pool?.pair === pool.address);
        const userNumShares =
            parseFloat(sharesOwned?.balance || '0') + fromFp(BigNumber.from(userFarm?.amount || 0)).toNumber();
        const poolTotalShares = parseFloat(pool.totalShares);
        const poolTotalValue = this.getPoolValue(pool, tokenPrices);
        const userPercentShare = userNumShares / poolTotalShares;
        const userTokens = _.orderBy(
            (pool.tokens || []).map((token) =>
                this.mapPoolTokenToUserPoolTokenData(token, userPercentShare, tokenPrices),
            ),
            'totalValue',
            'desc',
        );
        const userTotalValue = _.sumBy(userTokens, (token) => token.totalValue);

        return {
            userNumShares,
            userPercentShare,
            userTokens,
            userTotalValue,
            pricePerShare: poolTotalValue / poolTotalShares,
            poolTotalValue,
            poolTotalShares,
        };
    }

    private getPoolValue(pool: BalancerPoolFragment, tokenPrices: TokenPrices): number {
        return _.sum(
            (pool.tokens || []).map((token) => parseFloat(token.balance) * (tokenPrices[token.address]?.usd || 0)),
        );
    }

    public mapPortfolioDataToGql(data: UserPortfolioData): GqlUserPortfolioData {
        return {
            ...data,
            totalValue: `${data.totalValue}`,
            totalSwapFees: `${data.totalSwapFees}`,
            totalSwapVolume: `${data.totalSwapVolume}`,
            myFees: `${data.myFees}`,
            pools: data.pools.map((pool) => ({
                ...pool,
                totalValue: `${pool.totalValue}`,
                swapFees: `${pool.swapFees}`,
                swapVolume: `${pool.swapVolume}`,
                myFees: `${pool.myFees}`,
                priceChange: `${pool.priceChange}`,
                pricePerShare: `${pool.pricePerShare}`,
                shares: `${pool.shares}`,
                tokens: pool.tokens.map((token) => this.mapUserTokenDataToGql(token)),
            })),
            tokens: data.tokens.map((token) => this.mapUserTokenDataToGql(token)),
        };
    }

    private mapUserTokenDataToGql(token: UserTokenData): GqlUserTokenData {
        return {
            ...token,
            balance: `${token.balance}`,
            pricePerToken: `${token.pricePerToken}`,
            totalValue: `${token.totalValue}`,
        };
    }
}

export const portfolioService = new PortfolioService();
