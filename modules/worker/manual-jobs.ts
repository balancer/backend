import { workerQueue } from './queue';

export type WokerJobType = 'sync-pools' | 'user-sync-wallet-balances-for-all-pools' | 'user-sync-staked-balances';

export type WorkerJob = {
    type: WokerJobType;
};

async function scheduleJobWithInterval(job: WokerJobType, intervalMs: number): Promise<void> {
    await workerQueue.sendWithInterval(JSON.stringify({ type: job }), intervalMs);
}

// all jobs requiring manual scheduling will be handled here (e.g. sub minute crons)

export async function scheduleManualJobs(): Promise<void> {
    await scheduleJobWithInterval('sync-pools', 15000);
    await scheduleJobWithInterval('user-sync-wallet-balances-for-all-pools', 5000);
    await scheduleJobWithInterval('user-sync-staked-balances', 5000);
}
