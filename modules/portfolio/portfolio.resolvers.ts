import { Resolvers } from '../../schema';
import { portfolioService } from './portfolio.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const resolvers: Resolvers = {
    Query: {
        portfolioGetUserPortfolio: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            console.log(JSON.stringify(await portfolioService.getPortfolio(accountAddress), null, 4));

            const portfolioData = await portfolioService.getPortfolio(accountAddress);

            return portfolioService.mapPortfolioDataToGql(portfolioData);
        },
        portfolioGetUserPortfolioHistory: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            const portfolioHistoryData = await portfolioService.getPortfolioHistory(accountAddress);

            return portfolioHistoryData.map((data) => portfolioService.mapPortfolioDataToGql(data));
        },
    },
    //we're forced to have at least one mutation
    Mutation: {
        emptyMutation: async () => true,
    },
};

export default resolvers;
