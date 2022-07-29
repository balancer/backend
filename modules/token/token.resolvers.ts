import { Resolvers } from '../../schema';
import _ from 'lodash';
import { isAdminRoute } from '../auth/resolver-auth';
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
            const tokenPrices = await tokenService.getHistoricalTokenPrices();
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
        tokenGetPriceChartData: async (parent, { address, range }, context) => {
            const data = await tokenService.getDataForRange(address, range);

            return data.map((item) => ({
                id: `${address}-${item.timestamp}`,
                timestamp: item.timestamp,
                price: `${item.price}`,
            }));
        },
        tokenGetRelativePriceChartData: async (parent, { tokenIn, tokenOut, range }, context) => {
            const data = await tokenService.getRelativeDataForRange(tokenIn, tokenOut, range);

            return data.map((item) => ({
                id: `${tokenIn}-${tokenOut}-${item.timestamp}`,
                timestamp: item.timestamp,
                price: `${item.price}`,
            }));
        },
        tokenGetCandlestickChartData: async (parent, { address, range }, context) => {
            const data = await tokenService.getDataForRange(address, range);

            return data.map((item) => ({
                id: `${address}-${item.timestamp}`,
                timestamp: item.timestamp,
                open: `${item.open}`,
                high: `${item.high}`,
                low: `${item.low}`,
                close: `${item.close}`,
            }));
        },
        tokenGetTokenData: async (parent, { address }, context) => {
            return tokenService.getTokenData(address);
        },
        tokenGetTokensData: async (parent, { addresses }, context) => {
            return tokenService.getTokensData(addresses);
        },
    },
    Mutation: {
        tokenReloadTokenPrices: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.loadTokenPrices();

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
