import { poolService } from './pool.service';
import { Resolvers } from '../../schema';
import { isAdminRoute } from '../util/resolver-util';

const balancerResolvers: Resolvers = {
    Query: {
        poolGetPool: async (parent, { id }, context) => {
            return poolService.getGqlPool(id);
        },
    },
    Mutation: {
        poolSyncAllPoolsFromSubgraph: async (parent, {}, context) => {
            isAdminRoute(context);

            return poolService.syncAllPoolsFromSubgraph();
        },
        poolLoadOnChainDataForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.loadOnChainDataForAllPools();

            return 'success';
        },
        poolUpdateLiquidityValuesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.updateLiquidityValuesForAllPools();

            return 'success';
        },
        poolUpdateVolumeAndFeeValuesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.updateVolumeAndFeeValuesForAllPools();

            return 'success';
        },
        poolSyncSwapsForLast24Hours: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.syncSwapsForLast24Hours();

            return 'success';
        },
        poolLoadOnChainDataForPoolsWithActiveUpdates: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.loadOnChainDataForPoolsWithActiveUpdates();

            return 'success';
        },
    },
};

export default balancerResolvers;
