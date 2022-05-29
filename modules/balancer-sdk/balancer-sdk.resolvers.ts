import { Resolvers } from '../../schema';
import { balancerSorService } from './balancer-sor.service';
import { beetsService } from '../beets/beets.service';
import { tokenService } from '../token/token.service';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwaps: async (parent, args, context) => {
            const config = await beetsService.getConfig();
            const tokens = await tokenService.getTokens();

            return balancerSorService.getSwaps({ ...args, boostedPools: config.boostedPools, tokens });
        },
    },
};

export default balancerSdkResolvers;
