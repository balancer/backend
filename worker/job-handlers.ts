import * as Sentry from '@sentry/node';
import { Express, NextFunction } from 'express';
import { tokenService } from '../modules/token/token.service';
import { poolService } from '../modules/pool/pool.service';
import { beetsService } from '../modules/beets/beets.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { userService } from '../modules/user/user.service';
import { protocolService } from '../modules/protocol/protocol.service';
import { datastudioService } from '../modules/datastudio/datastudio.service';
import { getCronMetricsPublisher } from '../modules/metrics/cron.metric';
import { initRequestScopedContext, setRequestScopedContextValue } from '../modules/context/request-scoped-context';
import { coingeckoService } from '../modules/coingecko/coingecko.service';
import { CoingeckoDataService } from '../modules/token/lib/coingecko-data.service';

const runningJobs: Set<string> = new Set();

const defaultSamplingRate = 0.001;

async function runIfNotAlreadyRunning(
    id: string,
    chainId: string,
    fn: () => any,
    samplingRate: number,
    res: any,
    next: NextFunction,
): Promise<void> {
    const jobId = `${id}-${chainId}`;
    if (runningJobs.has(jobId)) {
        console.log('Skipping job', jobId);
        res.sendStatus(200);
        return;
    }
    try {
        const cronsMetricPublisher = getCronMetricsPublisher(chainId);
        runningJobs.add(jobId);
        const transaction = Sentry.startTransaction({ name: jobId }, { samplingRate: samplingRate.toString() });
        Sentry.configureScope((scope) => {
            scope.setSpan(transaction);
            scope.setTransactionName(`POST /${jobId}`);
        });
        transaction.sampled = true;
        console.time(jobId);
        console.log(`Start job ${jobId}`);
        await fn();
        cronsMetricPublisher.publish(`${jobId}-done`);
        if (Math.random() > samplingRate) {
            transaction.sampled = false;
        }
        console.log(`Finished job ${jobId}`);
        res.sendStatus(200);
    } catch (error) {
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.sampled = true;
        }
        Sentry.configureScope((scope) => {
            scope.setTag('error', jobId);
        });
        console.log(`Error job ${jobId}`);
        next(error);
    } finally {
        runningJobs.delete(jobId);
        console.timeEnd(jobId);
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.finish();
        }
    }
}

export function configureWorkerRoutes(app: Express) {
    app.post('/', async (req, res, next) => {
        const job = req.body as { name: string; chainId: string };
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', job.chainId);
        switch (job.name) {
            case 'sync-changed-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.syncChangedPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'user-sync-wallet-balances-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => userService.syncChangedWalletBalancesForAllPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'user-sync-staked-balances':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => userService.syncChangedStakedBalances(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'load-token-prices':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => tokenService.loadTokenPrices(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-liquidity-for-active-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.updateLiquidityValuesForPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-liquidity-for-inactive-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.updateLiquidityValuesForPools(0, 0.00000000001),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-pool-apr':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.updatePoolAprs(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'load-on-chain-data-for-pools-with-active-updates':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.loadOnChainDataForPoolsWithActiveUpdates(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-new-pools-from-subgraph':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.syncNewPoolsFromSubgraph(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-sanity-pool-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.syncSanityPoolData(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-tokens-from-pool-tokens':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => tokenService.syncSanityData(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'update-liquidity-24h-ago-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.updateLiquidity24hAgoForAllPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-fbeets-ratio':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => beetsService.syncFbeetsRatio(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'cache-average-block-time':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => blocksSubgraphService.cacheAverageBlockTime(),
                    0.001,
                    res,
                    next,
                );
                break;
            case 'sync-token-dynamic-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => tokenService.syncTokenDynamicData(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-staking-for-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.syncStakingForPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'cache-protocol-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => protocolService.cacheProtocolMetrics(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-latest-snapshots-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.syncLatestSnapshotsForAllPools(),
                    0.01,
                    res,
                    next,
                );
                break;
            case 'update-lifetime-values-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.updateLifetimeValuesForAllPools(),
                    defaultSamplingRate,
                    res,
                    next,
                );
                break;
            case 'sync-user-snapshots':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => userService.syncUserBalanceSnapshots(),
                    0.01,
                    res,
                    next,
                );
                break;
            case 'feed-data-to-datastudio':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => datastudioService.feedPoolData(),
                    0.0,
                    res,
                    next,
                );
                break;
            case 'sync-latest-reliquary-snapshots':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => poolService.syncLatestReliquarySnapshotsForAllFarms(),
                    0.01,
                    res,
                    next,
                );
                break;
            case 'sync-latest-relic-snapshots':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => userService.asyncSyncUserRelicSnapshots(),
                    0.01,
                    res,
                    next,
                );
                break;
            case 'purge-old-tokenprices':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => tokenService.purgeOldTokenPrices(),
                    0.01,
                    res,
                    next,
                );
                break;
            case 'sync-coingecko-coinids':
                await runIfNotAlreadyRunning(
                    job.name,
                    job.chainId,
                    () => tokenService.syncCoingeckoIds(),
                    0.01,
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
