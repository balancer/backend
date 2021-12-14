import { Resolvers } from '../../schema';
import { createLbpEvent, updateLbpEvent } from './lbp-events';

const lbpEventsResolvers: Resolvers = {
    Query: {},
    Mutation: {
        lbpEventCreate: async (parent, { lbpEvent, signature }) => {
            return createLbpEvent(lbpEvent, signature);
        },
        lbpEventUpdate: async (parent, { lbpEvent, signature }) => {
            return updateLbpEvent(lbpEvent, signature);
        },
    },
};

export default lbpEventsResolvers;
