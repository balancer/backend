import { Resolvers } from '../../schema';
import { gaugesService } from './gauges.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const gaugesResolvers: Resolvers = {
    Query: {
        gauges: async () => {
            return gaugesService.getAllGauges();
        },
        gaugesAllUserShares: async (parent, _, context) => {
            const address = getRequiredAccountAddress(context);
            return gaugesService.getAllUserShares(address);
        },
        gaugesUserShares: async (parent, { poolId }, context) => {
            const address = getRequiredAccountAddress(context);
            const userSharesForPool = await gaugesService.getUserSharesForPool(address, poolId);
            return userSharesForPool ?? null;
        },
    },
};

export default gaugesResolvers;
