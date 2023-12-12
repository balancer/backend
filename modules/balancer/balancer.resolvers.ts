import { Resolvers } from '../../schema';
import { sorService } from '../sor/sor.service';
import { getTokenAmountRaw } from '../sor/utils';

const balancerResolvers: Resolvers = {
    Query: {
        sorGetCowSwaps: async (parent, args, context) => {
            const amountToken = args.swapType === 'EXACT_IN' ? args.tokenIn : args.tokenOut;
            // Use TokenAmount to help follow scaling requirements in later logic
            // args.swapAmount is RawScale, e.g. 1USDC should be passed as 1000000
            const amount = await getTokenAmountRaw(amountToken, args.swapAmount, args.chain);
            const swaps = await sorService.getCowSwaps({ ...args, swapAmount: amount, swapOptions: {} });
            return { ...swaps, __typename: 'GqlCowSwapApiResponse' };
        },
    },
    Mutation: {
        balancerMutationTest: async (parent, {}, context) => {
            return 'test';
        },
    },
};

export default balancerResolvers;
