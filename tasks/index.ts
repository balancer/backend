import { JobsController } from '../modules/controllers/jobs-controller';
import { PoolsMutationController } from '../modules/controllers/pools-mutation-controller';
import { UserBalancesController } from '../modules/controllers/user-balances-controller';

// TODO needed?
const jobsController = JobsController();

/**
 * Used to run jobs or mutations locally from the command line
 * e.g. `yarn task sync-pools-v3 11155111`
 *
 * @param job
 * @param chain
 * @returns
 */
async function run(job: string = process.argv[2], chain: string = process.argv[3]) {
    console.log('Running job', job, chain);

    if (job === 'add-pools-v3') {
        return jobsController.addPools(chain);
    } else if (job === 'reload-pools-v3') {
        return jobsController.reloadPools(chain);
    } else if (job === 'sync-pools-v3') {
        return jobsController.syncPools(chain);
    } else if (job === 'sync-join-exits-v3') {
        return jobsController.syncJoinExitsV3(chain);
    } else if (job === 'sync-join-exits-v2') {
        return jobsController.syncJoinExitsV2(chain);
    } else if (job === 'backfill-join-exits-v2') {
        return jobsController.backfillJoinExitsV2(chain);
    } else if (job === 'sync-swaps-v2') {
        return jobsController.syncSwapsV2(chain);
    } else if (job === 'sync-swaps-v3') {
        return jobsController.syncSwapsV3(chain);
    } else if (job === 'update-liquidity-24h-ago') {
        return jobsController.updateLiquidity24hAgo(chain);
    } else if (job === 'sync-sftmx-staking') {
        return jobsController.syncSftmxStakingData(chain);
    } else if (job === 'sync-sftmx-withdrawal') {
        return jobsController.syncSftmxWithdrawalrequests(chain);
    } else if (job === 'sync-sftmx-staking-snapshots') {
        return jobsController.syncSftmxStakingSnapshots(chain);
    } else if (job === 'sync-user-balances-v3') {
        return UserBalancesController().syncUserBalancesFromV3Subgraph(chain);
    } else if (job === 'load-onchain-data-v3') {
        return PoolsMutationController().loadOnchainDataForAllPools(chain);
    }
    return Promise.reject(new Error(`Unknown job: ${job}`));
}

run()
    .then((r) => console.log(r))
    .then(() => process.exit(0))
    .catch((e) => console.error(e));
