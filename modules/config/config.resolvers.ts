import { Resolvers } from '../../schema';
import { configService } from './config.service';

const configResolvers: Resolvers = {
    Query: {
        configGetNewsItems: async (parent, {}, context) => {
            return (await configService.getHomeScreenConfig()).newsItems;
        },
    },
};

export default configResolvers;
