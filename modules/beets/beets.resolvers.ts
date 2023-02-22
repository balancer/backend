import { Resolvers } from '../../schema';
import { beetsService } from './token/beets-token.service';
import { getRequiredAccountAddress, isAdminRoute } from '../auth/auth-context';
import { reliquaryService } from './reliquary/reliquary.service';
import { userService } from '../user/user.service';

const beetsResolvers: Resolvers = {
    Query: {
        beetsGetFbeetsRatio: async (parent, {}, context) => {
            return beetsService.getFbeetsRatio();
        },
        beetsGetBeetsPrice: async (parent, {}, context) => {
            return beetsService.getBeetsPrice();
        },
        beetsPoolGetReliquaryFarmSnapshots: async (parent, { id, range }, context) => {
            const snapshots = await reliquaryService.getSnapshotsForReliquaryFarm(parseFloat(id), range);

            return snapshots.map((snapshot) => ({
                id: snapshot.id,
                farmId: snapshot.farmId,
                timestamp: snapshot.timestamp,
                relicCount: `${snapshot.relicCount}`,
                userCount: `${snapshot.userCount}`,
                totalBalance: snapshot.totalBalance,
                totalLiquidity: snapshot.totalLiquidity,
                dailyDeposited: snapshot.dailyDeposited,
                dailyWithdrawn: snapshot.dailyWithdrawn,
                levelBalances: snapshot.levelBalances,
                tokenBalances: snapshot.tokenBalances,
            }));
        },
    },
    Mutation: {
        beetsSyncFbeetsRatio: async (parent, {}, context) => {
            isAdminRoute(context);

            await beetsService.syncFbeetsRatio();

            return 'success';
        },
        beetsPoolLoadReliquarySnapshotsForAllFarms: async (parent, args, context) => {
            isAdminRoute(context);

            await reliquaryService.loadReliquarySnapshotsForAllFarms();

            return 'success';
        },
    },
};

export default beetsResolvers;
