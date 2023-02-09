import { createAlertsIfNotExist } from './create-alerts';
import { workerQueue } from './queue';
import { networkContext } from '../modules/network/network-context.service';

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
    await scheduleJobWithInterval(networkContext.config.workerJobs);
}

export async function createAlerts(): Promise<void> {
    await createAlertsIfNotExist(networkContext.config.workerJobs);
}
