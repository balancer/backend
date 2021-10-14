import { Resolvers } from '../../schema';
import { portfolioService } from './portfolio.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const resolvers: Resolvers = {
    Query: {
        portfolioGetPortfolio: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            return portfolioService.getPortfolio(accountAddress);
        },
    },
    //we're forced to have at least one mutation
    Mutation: {
        emptyMutation: async () => true,
    },
};

export default resolvers;
