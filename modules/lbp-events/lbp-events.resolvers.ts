import { Resolvers } from '../../schema';
import { createLbpEvent, updateLbpEvent } from './lbp-events';
import { prisma } from '../prisma/prisma-client';

const lbpEventsResolvers: Resolvers = {
    Query: {
        lbpEvent: async (parent, args) => {
            return prisma.lbpEvent.findUnique({
                where: { id: args.id },
                include: { admins: true },
                rejectOnNotFound: true,
            });
        },
        lbpEvents: () => {
            return prisma.lbpEvent.findMany({ include: { admins: true } });
        },
    },
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
