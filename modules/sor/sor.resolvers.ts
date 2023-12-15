import { Resolvers } from '../../schema';
import { balancerSorService } from './sorV1Beets/balancer-sor.service';
import { tokenService } from '../token/token.service';
import { sorService } from './sor.service';
import { getTokenAmountHuman } from './utils';
import { headerChain } from '../context/header-chain';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwaps: async (parent, args, context) => {
            const currentChain = headerChain();
            if (!args.chain && currentChain) {
                args.chain = currentChain;
            } else if (!args.chain) {
                throw new Error('sorGetSwaps error: Provide "chain" param');
            }

            return sorService.getBeetsSwaps(args);
        },
        sorGetBatchSwapForTokensIn: async (parent, args, context) => {
            const tokens = await tokenService.getTokens();

            return balancerSorService.getBatchSwapForTokensIn({ ...args, tokens });
        },
        sorGetCowSwaps: async (parent, args, context) => {
            return sorService.getCowSwaps(args);
        },
    },
};

export default balancerSdkResolvers;
