import { JobsController } from '../modules/controllers/jobs-controller';

// TODO needed?
const jobsController = JobsController();

async function run(job: string = process.argv[2], chain: string = process.argv[3]) {
    console.log('Running job', job, chain);

    if (job === 'sync-pools-v3') {
        return jobsController.syncPools(chain);
    } else if (job === 'sync-join-exits-v3') {
        return jobsController.syncJoinExitsV3(chain);
    } else if (job === 'sync-join-exits-v2') {
        return jobsController.syncJoinExitsV2(chain);
    }

    return Promise.reject(new Error(`Unknown job: ${job}`));
}

run()
    .then((r) => console.log)
    .then(() => process.exit(0))
    .catch((e) => console.error);
