import { Resolvers } from '../../schema';
import { portfolioService } from './portfolio.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const resolvers: Resolvers = {
    Query: {
        portfolioGetPortfolio: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            //await portfolioService.getPortfolio(accountAddress);

            await portfolioService.getPortfolioHistory(accountAddress);
            return {
                tokens: [],
            };
        },
    },
    //we're forced to have at least one mutation
    Mutation: {
        someMutation: async () => true,
    },
};

export default resolvers;
