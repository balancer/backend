import { Resolvers } from '../../schema';
import { configService } from './content.service';

const contentResolvers: Resolvers = {
    Query: {
        contentGetNewsItems: async () => {
            return (await configService.getHomeScreenConfig()).newsItems;
        },
    },
};

export default contentResolvers;
