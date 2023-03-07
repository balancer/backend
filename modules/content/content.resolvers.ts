import { Resolvers } from '../../schema';
import { networkContext } from '../network/network-context.service';

const contentResolvers: Resolvers = {
    Query: {
        contentGetNewsItems: async () => {
            return await networkContext.config.contentService.getNewsItems();
        },
    },
};

export default contentResolvers;
