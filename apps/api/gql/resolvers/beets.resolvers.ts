import { Resolvers } from '../generated-schema';
import { isAdminRoute } from '../../../../modules/auth/auth-context';
import { poolService } from '../../../../modules/pool/pool.service';
import { headerChain } from '../../../../modules/context/header-chain';
import { GraphQLError } from 'graphql';

const beetsResolvers: Resolvers = {
    Query: {
        beetsPoolGetReliquaryFarmSnapshots: async (parent, { id, range, chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new GraphQLError('Provide "chain" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }

            const snapshots = await poolService.getSnapshotsForReliquaryFarm(parseFloat(id), range, chain);

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
            }));
        },
    },
    Mutation: {
        beetsPoolLoadReliquarySnapshotsForAllFarms: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await poolService.loadReliquarySnapshotsForAllFarms(chain);

            return 'success';
        },
    },
};

export default beetsResolvers;
