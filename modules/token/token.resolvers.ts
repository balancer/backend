import { Resolvers } from '../../schema';
import _ from 'lodash';
import { isAdminRoute } from '../auth/auth-context';
import { tokenService } from './token.service';
import { headerChain } from '../context/header-chain';
import { syncLatestFXPrices } from './latest-fx-price';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

const resolvers: Resolvers = {
    Query: {
        tokenGetTokens: async (parent, { chains }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('tokenGetTokens error: Provide "chains" param');
            }
            return tokenService.getTokenDefinitions(chains);
        },
        tokenGetCurrentPrices: async (parent, { chains }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('tokenGetCurrentPrices error: Provide "chains" param');
            }
            const prices = await tokenService.getWhiteListedTokenPrices(chains);

            return prices.map((price) => ({
                address: price.tokenAddress,
                price: price.price,
                chain: price.chain,
            }));
        },
        tokenGetHistoricalPrices: async (parent, { addresses, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetHistoricalPrices error: Provide "chain" param');
            }
            const tokenPrices = await tokenService.getHistoricalTokenPrices(chain);
            const filtered = _.pickBy(tokenPrices, (entries, address) => addresses.includes(address));

            return _.map(filtered, (entries, address) => ({
                address,
                prices: entries.map((entry) => ({
                    timestamp: `${entry.timestamp}`,
                    price: entry.price,
                })),
            }));
        },
        tokenGetTokenDynamicData: async (parent, { address, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetTokenDynamicData error: Provide "chain" param');
            }
            const data = await tokenService.getTokenDynamicData(address, chain);

            return data
                ? {
                      ...data,
                      id: data.coingeckoId,
                      fdv: data.fdv ? `${data.fdv}` : null,
                      marketCap: data.marketCap ? `${data.marketCap}` : null,
                      updatedAt: data.updatedAt.toUTCString(),
                  }
                : null;
        },
        tokenGetTokensDynamicData: async (parent, { addresses, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetTokensDynamicData error: Provide "chain" param');
            }
            const items = await tokenService.getTokensDynamicData(addresses, chain);

            return items.map((item) => ({
                ...item,
                id: item.coingeckoId,
                fdv: item.fdv ? `${item.fdv}` : null,
                marketCap: item.marketCap ? `${item.marketCap}` : null,
                updatedAt: item.updatedAt.toUTCString(),
            }));
        },
        tokenGetPriceChartData: async (parent, { address, range, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetRelativePriceChartData error: Provide "chain" param');
            }
            const data = await tokenService.getDataForRange(address, range, chain);

            return data.map((item) => ({
                id: `${address}-${item.timestamp}`,
                timestamp: item.timestamp,
                price: `${item.price}`,
            }));
        },
        tokenGetRelativePriceChartData: async (parent, { tokenIn, tokenOut, range, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetRelativePriceChartData error: Provide "chain" param');
            }
            const data = await tokenService.getRelativeDataForRange(tokenIn, tokenOut, range, chain);

            return data.map((item) => ({
                id: `${tokenIn}-${tokenOut}-${item.timestamp}`,
                timestamp: item.timestamp,
                price: `${item.price}`,
            }));
        },
        tokenGetCandlestickChartData: async (parent, { address, range, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetCandlestickChartData error: Provide "chain" param');
            }
            const data = await tokenService.getDataForRange(address, range, chain);

            return data.map((item) => ({
                id: `${address}-${item.timestamp}`,
                timestamp: item.timestamp,
                open: `${item.open}`,
                high: `${item.high}`,
                low: `${item.low}`,
                close: `${item.close}`,
            }));
        },
        tokenGetTokenData: async (parent, { address, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('tokenGetRelativePriceChartData error: Provide "chain" param');
            }
            const token = await tokenService.getToken(address, chain);
            if (token) {
                return {
                    ...token,
                    id: token.address,
                    tokenAddress: token.address,
                };
            }
            return null;
        },
        tokenGetTokensData: async (parent, { addresses }, context) => {
            const tokens = await tokenService.getTokens(addresses);
            return tokens.map((token) => ({ ...token, id: token.address, tokenAddress: token.address }));
        },
        tokenGetProtocolTokenPrice: async (parent, {}, context) => {
            return tokenService.getProtocolTokenPrice();
        },
    },
    Mutation: {
        tokenReloadTokenPrices: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.updateTokenPrices();

            return true;
        },
        tokenSyncTokenDefinitions: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.syncTokenContentData();

            return 'success';
        },
        tokenSyncTokenDynamicData: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.syncCoingeckoPricesForAllChains();

            return 'success';
        },
        tokenSyncLatestFxPrices: async (parent, { chain }, context) => {
            isAdminRoute(context);
            const subgraphUrl = AllNetworkConfigsKeyedOnChain[chain].data.subgraphs.balancer;

            await syncLatestFXPrices(subgraphUrl, chain);

            return 'success';
        },
        tokenInitChartData: async (parent, { tokenAddress }, context) => {
            isAdminRoute(context);

            await tokenService.initChartData(tokenAddress);

            return 'success';
        },
        tokenDeletePrice: async (parent, args, context) => {
            isAdminRoute(context);

            return tokenService.deleteTokenPrice(args);
        },
        tokenDeleteTokenType: async (parent, args, context) => {
            isAdminRoute(context);

            await tokenService.deleteTokenType(args);

            return 'success';
        },
        tokenReloadAllTokenTypes: async (parent, {}, context) => {
            isAdminRoute(context);

            await tokenService.reloadAllTokenTypes();

            return 'success';
        },
    },
};

export default resolvers;
