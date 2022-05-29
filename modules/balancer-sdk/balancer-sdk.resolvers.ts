import { Resolvers } from '../../schema';
import { balancerSorService } from './balancer-sor.service';
import { balancerService } from '../balancer/balancer.service';
import { beetsService } from '../beets/beets.service';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwaps: async (parent, args, context) => {
            const config = await beetsService.getConfig();
            const pools = await balancerService.getPools();

            return balancerSorService.getSwaps({ ...args, boostedPools: config.boostedPools, pools });
        },
    },
};

export default balancerSdkResolvers;
