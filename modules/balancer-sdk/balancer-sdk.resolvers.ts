import { Resolvers } from '../../schema';
import { beetsService } from '../beets/beets.service';
import { balancerSorService } from './balancer-sor.service';
import { balancerService } from '../balancer/balancer.service';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwaps: async (parent, { input }, context) => {
            const config = await beetsService.getConfig();
            const pools = await balancerService.getPools();

            return balancerSorService.getSwaps({ ...input, boostedPools: config.boostedPools, pools });
        },
    },
};

export default balancerSdkResolvers;
