import { Resolvers } from '../../schema';
import { createLge, getLge, getLges } from './lge';

const lgeResolvers: Resolvers = {
    Query: {
        lge: async (parent, args) => {
            return getLge(args.id);
        },
        lges: () => {
            return getLges();
        },
    },
    Mutation: {
        lgeCreate: async (parent, { lge, signature }) => {
            return createLge(lge, signature);
        },
        /*lbpEventUpdate: async (parent, { lbpEvent, signature }) => {
            return updateLbpEvent(lbpEvent, signature);
        },*/
    },
};

export default lgeResolvers;
