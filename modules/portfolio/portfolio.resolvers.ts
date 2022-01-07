import { Resolvers } from '../../schema';
import { portfolioService } from './portfolio.service';
import { getRequiredAccountAddress, isAdminRoute } from '../util/resolver-util';
import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { masterchefService } from '../masterchef-subgraph/masterchef.service';
import { beetsBarService } from '../beets-bar-subgraph/beets-bar.service';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import moment from 'moment-timezone';

const resolvers: Resolvers = {
    Query: {
        portfolioGetUserPortfolio: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            const portfolioData = await portfolioService.getPortfolio(accountAddress);

            return portfolioService.mapPortfolioDataToGql(portfolioData);
        },
        portfolioGetUserPortfolioHistory: async (parent, {}, context) => {
            /*const accountAddress = getRequiredAccountAddress(context);

            const portfolioHistoryData = await portfolioService.getPortfolioHistory(accountAddress);

            return portfolioHistoryData.map((data) => portfolioService.mapPortfolioDataToGql(data));*/

            return [];
        },
        portfolioGetUserPortfolioHistoryAdmin: async (parent, {}, context) => {
            isAdminRoute(context);

            const accountAddress = getRequiredAccountAddress(context);

            const portfolioHistoryData = await portfolioService.getPortfolioHistory(accountAddress);

            return portfolioHistoryData.map((data) => portfolioService.mapPortfolioDataToGql(data));
        },
    },
    Mutation: {
        cachePortfolioHistoryForDate: async (parent, { date }, context) => {
            isAdminRoute(context);

            await portfolioService.cacheRawDataForTimestamp(moment.tz(date, 'GMT').startOf('day').unix());

            return true;
        },
        clearCacheAtBlock: async (parent, { block }, context) => {
            isAdminRoute(context);

            await balancerSubgraphService.clearCacheAtBlock(block);
            await masterchefService.clearCacheAtBlock(block);
            await beetsBarService.clearCacheAtBlock(block);

            return true;
        },
        clearCachedPools: async (parent, {}, context) => {
            isAdminRoute(context);

            const blocks = await blocksSubgraphService.getDailyBlocks(30);

            for (const block of blocks) {
                await balancerSubgraphService.clearPoolsAtBlock(parseInt(block.number));
            }

            return true;
        },
    },
};

export default resolvers;
