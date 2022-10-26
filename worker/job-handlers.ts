import * as Sentry from '@sentry/node';
import { Express, NextFunction } from 'express';
import { tokenService } from '../modules/token/token.service';
import { poolService } from '../modules/pool/pool.service';
import { beetsService } from '../modules/beets/beets.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { userService } from '../modules/user/user.service';
import { protocolService } from '../modules/protocol/protocol.service';
import { cronsMetricPublisher } from '../modules/metrics/cron.metric';
import { datastudioService } from '../modules/datastudio/datastudio.service';

const runningJobs: Set<string> = new Set();

const defaultSamplingRate = 0.005;

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
            scope.setTransactionName(`POST /${id}`);
        });
        transaction.sampled = true;
        console.time(id);
        console.log(`Start job ${id}`);
        await fn();
        cronsMetricPublisher.publish(`${id}-done`);
        if (Math.random() > samplingRate) {
            transaction.sampled = false;
        }
        console.log(`Finished job ${id}`);
        res.sendStatus(200);
    } catch (error) {
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.sampled = true;
        }
        Sentry.configureScope((scope) => {
            scope.setTag('error', id);
        });
        console.log(`Error job ${id}`);
        next(error);
    } finally {
        runningJobs.delete(id);
        console.timeEnd(id);
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.finish();
        }
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
            case 'load-token-prices':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => tokenService.loadTokenPrices(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-liquidity-for-active-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.updateLiquidityValuesForPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-liquidity-for-inactive-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.updateLiquidityValuesForPools(0, 0.00000000001),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-pool-apr':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.updatePoolAprs(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'load-on-chain-data-for-pools-with-active-updates':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.loadOnChainDataForPoolsWithActiveUpdates(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-new-pools-from-subgraph':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.syncNewPoolsFromSubgraph(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-sanity-pool-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.syncSanityPoolData(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-tokens-from-pool-tokens':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => tokenService.syncSanityData(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-liquidity-24h-ago-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.updateLiquidity24hAgoForAllPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-fbeets-ratio':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => beetsService.syncFbeetsRatio(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'cache-average-block-time':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => blocksSubgraphService.cacheAverageBlockTime(),
                    0.02,
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
                    0.1,
                    res,
                    next,
                );
                break;
            case 'update-lifetime-values-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    () => poolService.updateLifetimeValuesForAllPools(),
                    0.02,
                    res,
                    next,
                );
                break;
            case 'sync-user-snapshots':
                await runIfNotAlreadyRunning(job.name, () => userService.syncUserBalanceSnapshots(), 0.01, res, next);
                break;
            case 'feed-data-to-datastudio':
                await runIfNotAlreadyRunning(job.name, () => datastudioService.feedPoolData(), 0.0, res, next);
                break;
            default:
                res.sendStatus(400);
                throw new Error(`Unhandled job type ${job.name}`);
        }
    });
}
