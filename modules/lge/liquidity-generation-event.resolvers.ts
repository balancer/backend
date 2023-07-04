import { Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { liquidityGenerationEventService } from './liquidity-generation-event.service';

const liquidityGenerationEventResolvers: Resolvers = {
    Query: {
        lge: async (parent, args) => {
            return liquidityGenerationEventService.getLiquidityGenerationEvent(args.id);
        },
        lges: () => {
            return liquidityGenerationEventService.getLges();
        },
        lgeGetChartData: async (parent, args) => {
            return liquidityGenerationEventService.getLgeChartData(args.id);
        },
    },
    Mutation: {
        lgeCreate: async (parent, { lge }) => {
            return liquidityGenerationEventService.upsertLiquidityGenerationEvent(lge);
        },
        lgeSyncFromSanity: async (parent, args, context) => {
            isAdminRoute(context);

            await liquidityGenerationEventService.syncLgesFromSanity();

            return 'success';
        },
    },
};

export default liquidityGenerationEventResolvers;
