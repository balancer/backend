import { GraphQLError } from 'graphql';
import { latestTokenPrice } from '../../../../modules/token/latest-token-price';
import { Resolvers } from '../generated-schema';
import { isAddress } from 'viem';

export default {
    Query: {
        // Added to allow pool creator to query prices not stored in the DB
        usdPrices: async (_, { chain, tokens }) => {
            tokens = tokens.filter((token) => isAddress(token));

            if (tokens.length === 0 || tokens.length > 8) {
                throw new GraphQLError('Tokens needs to have at least one and less than 8 tokens', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }

            const prices = await latestTokenPrice(chain, tokens);

            return Object.keys(prices).map((token) => ({
                chain,
                address: token,
                price: prices[token],
                updatedAt: 0,
            }));
        },
    },
} as Resolvers;
