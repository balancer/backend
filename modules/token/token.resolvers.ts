import { GqlTokenPrice, Resolvers } from '../../schema';
import { tokenPriceService } from '../token-price/token-price.service';
import _ from 'lodash';
import { isAdminRoute } from '../util/resolver-util';
import { isAddress } from 'ethers/lib/utils';
import { tokenService } from './token.service';

const resolvers: Resolvers = {
    Query: {
        tokenGetTokens: async (parent, {}, context) => {
            return tokenService.getTokenDefinitions();
        },
        tokenGetCurrentPrices: async (parent, {}, context) => {
            const prices = await tokenService.getCurrentTokenPrices();

            return prices.map((price) => ({
                address: price.tokenAddress,
                price: price.price,
            }));
        },
        tokenGetHistoricalPrices: async (parent, { addresses }, context) => {
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
        tokenReloadTokenPrices: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenPriceService.cacheTokenPrices();

            return true;
        },
        tokenSyncTokenDefinitions: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.syncTokensFromPoolTokens();
            await tokenService.syncSanityData();

            return 'success';
        },
    },
};

export default resolvers;
