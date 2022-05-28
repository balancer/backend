import { Resolvers } from '../../schema';
import { gaugesService } from './gauges.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const gaugesResolvers: Resolvers = {
    Query: {
        gauges: async () => {
            return gaugesService.getAllGauges();
        },
        gaugesUserShares: async (parent, _, context) => {
            const address = getRequiredAccountAddress(context);
            return gaugesService.getUserShares(address);
        },
    },
};

export default gaugesResolvers;
