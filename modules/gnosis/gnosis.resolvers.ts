import { Resolvers } from '../../schema';
import { getRequiredAccountAddress } from '../util/resolver-util';
import { isAddressGnosisSafe } from './gnosis';

const gnosisResolvers: Resolvers = {
    Query: {
        gnosisIsUserMultisigWallet: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            return isAddressGnosisSafe(accountAddress);
        },
    },
};

export default gnosisResolvers;
