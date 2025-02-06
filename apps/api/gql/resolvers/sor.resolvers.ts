import { Resolvers } from '../generated-schema';
import { sorService } from '../../../../modules/sor/sor.service';
import { headerChain } from '../../../../modules/context/header-chain';
import { GraphQLError } from 'graphql';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwapPaths: async (parent, args, context) => {
            return sorService.getSorSwapPaths(args);
        },
    },
};

export default balancerSdkResolvers;
