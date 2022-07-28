import { workerQueue } from './queue';

export type WokerJobType = 'sync-pools' | 'user-sync-wallet-balances-for-all-pools' | 'user-sync-staked-balances';

export type WorkerJob = {
    type: WokerJobType;
};

async function scheduleJobWithMinimumInterval(job: WokerJobType, minIntervalMs: number): Promise<void> {
    await workerQueue.sendWithMinimumInterval(JSON.stringify({ type: job }), minIntervalMs);
}

// all jobs requiring manual scheduling will be handled here (e.g. sub minute crons)

export async function scheduleManualJobs(): Promise<void> {
    await scheduleJobWithMinimumInterval('sync-pools', 5000);
    await scheduleJobWithMinimumInterval('user-sync-wallet-balances-for-all-pools', 1000);
    await scheduleJobWithMinimumInterval('user-sync-staked-balances', 1000);
}
