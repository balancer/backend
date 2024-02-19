import { JobsController } from '@modules/controllers/jobs-controller';

const jobsController = JobsController();

async function run(job: string = process.argv[2], chain: string = process.argv[3]) {
    console.log('Running job', job, chain);

    if (job === 'sync-changed-pools-v3') {
        return jobsController.syncPools(chain);
    }

    return Promise.reject(new Error(`Unknown job: ${job}`));
}

run()
    .then((r) => console.log)
    .then(() => process.exit(0))
    .catch((e) => console.error);
