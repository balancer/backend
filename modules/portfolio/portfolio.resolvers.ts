import { Resolvers } from '../../schema';
import { portfolioService } from './portfolio.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const resolvers: Resolvers = {
    Query: {
        portfolioGetPortfolio: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            console.log(JSON.stringify(await portfolioService.getPortfolio(accountAddress), null, 4));

            return portfolioService.getPortfolio(accountAddress);
        },
        portfolioGetPortfolioHistory: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            await portfolioService.getPortfolioHistory(accountAddress);

            return true;
        },
    },
    //we're forced to have at least one mutation
    Mutation: {
        emptyMutation: async () => true,
    },
};

export default resolvers;
