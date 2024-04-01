import { Resolvers } from '../../schema';
import { headerChain } from '../context/header-chain';
import { networkContext } from '../network/network-context.service';

const contentResolvers: Resolvers = {
    Query: {
        contentGetNewsItems: async (parent, { chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('contentGetNewsItems error: Provide "chain" param');
            }
            return await networkContext.config.contentService.getNewsItems(chain);
        },
    },
};

export default contentResolvers;
