import { Resolvers } from '../../schema';
import { headerChain } from '../context/header-chain';
import { networkContext } from '../network/network-context.service';
import { SanityContentService } from './sanity-content.service';

const contentResolvers: Resolvers = {
    Query: {
        contentGetNewsItems: async (parent, { chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('contentGetNewsItems error: Provide "chain" param');
            }
            const sanityContent = new SanityContentService();
            return sanityContent.getNewsItems(chain);
        },
    },
};

export default contentResolvers;
