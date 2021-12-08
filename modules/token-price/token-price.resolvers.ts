import { Resolvers } from '../../schema';
import { tokenPriceService } from './token-price.service';
import _ from 'lodash';
import { isAdminRoute } from '../util/resolver-util';

const resolvers: Resolvers = {
    Query: {
        tokenPriceGetCurrentPrices: async (parent, {}, context) => {
            const tokenPrices = await tokenPriceService.getTokenPrices();

            return _.map(tokenPrices, (price, address) => ({ address, price: price.usd }));
        },
        tokenPriceGetHistoricalPrices: async (parent, { addresses }, context) => {
            const tokenPrices = await tokenPriceService.getHistoricalTokenPrices();
            const filtered = _.pickBy(tokenPrices, (entries, address) => addresses.includes(address));

            return _.map(filtered, (entries, address) => ({
                address,
                prices: entries.map((entry) => ({
                    timestamp: `${entry.timestamp}`,
                    price: entry.price,
                })),
            }));
        },
    },
    Mutation: {
        reloadTokenPrices: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenPriceService.cacheTokenPrices();

            return true;
        },
    },
};

export default resolvers;
