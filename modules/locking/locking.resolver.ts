import { Resolvers } from '../../schema';
import { getRequiredAccountAddress } from '../util/resolver-util';
import { lockingService } from './locking.service';

const lockingResolver: Resolvers = {
    Query: {
        locker: async () => {
            return lockingService.getLocker({});
        },
        lockingUser: async (parent, args, context) => {
            const accountAddress = getRequiredAccountAddress(context);
            return lockingService.getUser(accountAddress);
        },
        lockingRewardTokens: async () => {
            return lockingService.getRewardTokens();
        },
        lockingPendingRewards: async (parent, args, context) => {
            const accountAddress = getRequiredAccountAddress(context);
            return lockingService.getPendingRewards(accountAddress);
        },
        lockingUserVotingPower: async (parent, args, context) => {
            const accountAddress = getRequiredAccountAddress(context);
            return lockingService.getVotingPower(accountAddress);
        },
    },
};

export default lockingResolver;
