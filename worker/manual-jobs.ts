import { createAlertsIfNotExist } from './create-alerts';
import { workerQueue } from './queue';
import { AllNetworkConfigs } from '../modules/network/network-config';

export type WorkerJob = {
    name: string;
    interval: number;
    chainId: string;
};

async function scheduleJobWithInterval(chainId: string, jobs: WorkerJob[]): Promise<void> {
    for (const job of jobs) {
        await workerQueue.sendWithInterval(JSON.stringify({ name: job.name, chainId: job.chainId }), job.interval);
    }
}

export async function scheduleJobs(chainId: string): Promise<void> {
    await scheduleJobWithInterval(chainId, AllNetworkConfigs[chainId].workerJobs);
}

export async function createAlerts(chainId: string): Promise<void> {
    await createAlertsIfNotExist(chainId, AllNetworkConfigs[chainId].workerJobs);
}
