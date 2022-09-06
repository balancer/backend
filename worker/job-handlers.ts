import * as Sentry from '@sentry/node';
import { Express, NextFunction } from 'express';
import { tokenService } from '../modules/token/token.service';
import { poolService } from '../modules/pool/pool.service';
import { beetsService } from '../modules/beets/beets.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { userService } from '../modules/user/user.service';
import { protocolService } from '../modules/protocol/protocol.service';
import { cronsMetricPublisher } from '../modules/metrics/cron.metric';

const runningJobs: Set<string> = new Set();

const defaultSamplingRate = 0.01;

async function runIfNotAlreadyRunning(
    id: string,
    fn: () => any,
    samplingRate: number,
    res: any,
    next: NextFunction,
): Promise<void> {
    if (runningJobs.has(id)) {
        console.log('Skipping job', id);
        res.sendStatus(200);
        return;
    }
    try {
        runningJobs.add(id);
        const transaction = Sentry.startTransaction({ name: id }, { samplingRate: samplingRate.toString() });
        Sentry.configureScope((scope) => {
            scope.setSpan(transaction);
        });
        transaction.sampled = true;
        console.time(id);
        console.log(`Start job ${id}`);
        await fn();
        cronsMetricPublisher.publish(`${id}-done`);
        if (Math.random() > samplingRate) {
            transaction.sampled = false;
        }
    } catch (error) {
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.sampled = true;
        }
        Sentry.configureScope((scope) => {
            scope.setTag('error', id);
        });
        next(error);
    } finally {
        runningJobs.delete(id);
        console.timeEnd(id);
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.finish();
        }
        console.log(`Finished job ${id}`);
        res.sendStatus(200);
    }
}

export function configureWorkerRoutes(app: Express) {
    // all manual triggered (e.g. fast running) jobs will be handled here
    app.post('/', async (req, res, next) => {
        const job = req.body as { name: string };
        switch (job.name) {
            case 'sync-changed-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.syncChangedPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'user-sync-wallet-balances-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => userService.syncChangedWalletBalancesForAllPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'user-sync-staked-balances':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => userService.syncChangedStakedBalances(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'cache-average-block-time':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => blocksSubgraphService.cacheAverageBlockTime(),
                    0.05,
                    res,
                    next,
                );
                break;
            case 'sync-token-dynamic-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => tokenService.syncTokenDynamicData(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-staking-for-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.syncStakingForPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'cache-protocol-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => protocolService.cacheProtocolMetrics(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-latest-snapshots-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.syncLatestSnapshotsForAllPools(),
                    0.5,
                    res,
                    next,
                );
                break;
            case 'update-lifetime-values-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.updateLifetimeValuesForAllPools(),
                    0.05,
                    res,
                    next,
                );
                break;
            default:
                res.sendStatus(400);
                throw new Error(`Unhandled job type ${job.name}`);
        }
    });
}
