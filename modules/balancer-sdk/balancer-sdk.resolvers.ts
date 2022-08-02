import { Resolvers } from '../../schema';
import { balancerSorService } from './balancer-sor.service';
import { tokenService } from '../token/token.service';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwaps: async (parent, args, context) => {
            const tokens = await tokenService.getTokens();

            return balancerSorService.getSwaps({ ...args, boostedPools: [], tokens });
        },
    },
};

export default balancerSdkResolvers;
