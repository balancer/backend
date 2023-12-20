import { Resolvers } from '../../schema';
import { balancerSorService } from './balancer-sor.service';
import { tokenService } from '../token/token.service';
import { sorService } from '../sor/sor.service';
import { getTokenAmountHuman } from '../sor/utils';
import { headerChain } from '../context/header-chain';

const balancerSdkResolvers: Resolvers = {
    Query: {
        sorGetSwaps: async (parent, args, context) => {
            console.log('sorGetSwaps args', JSON.stringify(args));

            const currentChain = headerChain();
            if (!args.chain && currentChain) {
                args.chain = currentChain;
            } else if (!args.chain) {
                throw new Error('sorGetSwaps error: Provide "chain" param');
            }
            const chain = args.chain;
            const tokenIn = args.tokenIn.toLowerCase();
            const tokenOut = args.tokenOut.toLowerCase();
            const amountToken = args.swapType === 'EXACT_IN' ? tokenIn : tokenOut;
            // Use TokenAmount to help follow scaling requirements in later logic
            // args.swapAmount is HumanScale
            const amount = await getTokenAmountHuman(amountToken, args.swapAmount, args.chain);

            const swaps = await sorService.getBeetsSwaps({
                ...args,
                chain,
                tokenIn,
                tokenOut,
                swapAmount: amount,
            });

            return { ...swaps, __typename: 'GqlSorGetSwapsResponse' };
        },
        sorGetBatchSwapForTokensIn: async (parent, args, context) => {
            const tokens = await tokenService.getTokens();

            return balancerSorService.getBatchSwapForTokensIn({ ...args, tokens });
        },
    },
};

export default balancerSdkResolvers;
