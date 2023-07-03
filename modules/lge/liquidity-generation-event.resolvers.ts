import { Resolvers } from '../../schema';
import { liquidityGenerationEventService } from './liquidity-generation-event.service';

const liquidityGenerationEventResolvers: Resolvers = {
    Query: {
        lge: async (parent, args) => {
            return liquidityGenerationEventService.getLiquidityGenerationEvent(args.id);
        },
        lges: () => {
            return liquidityGenerationEventService.getLges();
        },
        getLgeChartData: async (parent, args) => {
            return liquidityGenerationEventService.getLgeChartData(args.id);
        },
    },
    Mutation: {
        lgeCreate: async (parent, { lge }) => {
            return liquidityGenerationEventService.upsertLiquidityGenerationEvent(lge);
        },
    },
};

export default liquidityGenerationEventResolvers;
