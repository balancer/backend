import { isFantomNetwork } from '../modules/config/network-config';
import { createAlertsIfNotExist } from './create-alerts';
import { fantomJobs } from './fantom-jobs';
import { optimismJobs } from './optimism-jobs';
import { workerQueue } from './queue';

export type WorkerJob = {
    name: string;
    interval: number;
};

async function scheduleJobWithInterval(jobs: WorkerJob[]): Promise<void> {
    for (const job of jobs) {
        await workerQueue.sendWithInterval(JSON.stringify({ name: job.name }), job.interval);
    }
}

export async function scheduleJobs(): Promise<void> {
    if (isFantomNetwork()) {
        await scheduleJobWithInterval(fantomJobs);
    } else {
        await scheduleJobWithInterval(optimismJobs);
    }
}

export async function createAlerts(): Promise<void> {
    if (isFantomNetwork()) {
        await createAlertsIfNotExist(fantomJobs);
    } else {
        await createAlertsIfNotExist(optimismJobs);
    }
}
