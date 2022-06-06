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
            const prices = await tokenService.getWhiteListedTokenPrices();

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
        tokenGetTokenDynamicData: async (parent, { address }, context) => {
            const data = await tokenService.getTokenDynamicData(address);

            return data
                ? {
                      ...data,
                      fdv: data.fdv ? `${data.fdv}` : null,
                      marketCap: data.marketCap ? `${data.marketCap}` : null,
                      updatedAt: data.updatedAt.toUTCString(),
                  }
                : null;
        },
        tokenGetTokensDynamicData: async (parent, { addresses }, context) => {
            const items = await tokenService.getTokensDynamicData(addresses);

            return items.map((item) => ({
                ...item,
                fdv: item.fdv ? `${item.fdv}` : null,
                marketCap: item.marketCap ? `${item.marketCap}` : null,
                updatedAt: item.updatedAt.toUTCString(),
            }));
        },
        tokenGetChartData: async (parent, args, context) => {
            return tokenService.getChartData(args);
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

            await tokenService.syncSanityData();

            return 'success';
        },
        tokenSyncTokenDynamicData: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.syncTokenDynamicData();

            return 'success';
        },
        tokenInitChartData: async (parent, { tokenAddress }, context) => {
            isAdminRoute(context);

            await tokenService.initChartData(tokenAddress);

            return 'success';
        },
    },
};

export default resolvers;
