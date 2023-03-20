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
import { AllNetworkConfigs } from '../modules/network/network-config';

export type WorkerJob = {
    name: string;
    interval: number;
};

const runningJobs: Set<string> = new Set();

const defaultSamplingRate = 0.001;

export async function scheduleJobs(chainId: string): Promise<void> {
    for (const job of AllNetworkConfigs[chainId].workerJobs) {
        await sendWithInterval(job, chainId);
    }
}

async function runIfNotAlreadyRunning(id: string, chainId: string, fn: () => any, samplingRate: number): Promise<void> {
    const jobId = `${id}-${chainId}`;
    if (runningJobs.has(jobId)) {
        console.log('Skipping job', jobId);
        return;
    }
    try {
        runningJobs.add(jobId);

        const transaction = Sentry.startTransaction({ name: jobId }, { samplingRate: samplingRate.toString() });
        Sentry.configureScope((scope) => {
            scope.setSpan(transaction);
            scope.setTransactionName(`${jobId}`);
        });
        transaction.sampled = true;

        console.time(jobId);
        console.log(`Start job ${jobId}`);

        await fn();

        if (process.env.AWS_ALERTS === 'true') {
            const cronsMetricPublisher = getCronMetricsPublisher(chainId);
            await cronsMetricPublisher.publish(`${jobId}-done`);
        }

        if (Math.random() > samplingRate) {
            transaction.sampled = false;
        }

        console.log(`Finished job ${jobId}`);
    } catch (error) {
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.sampled = true;
        }

        Sentry.configureScope((scope) => {
            scope.setTag('error', jobId);
        });

        console.log(`Error job ${jobId}`);
    } finally {
        runningJobs.delete(jobId);
        console.timeEnd(jobId);

        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
            transaction.finish();
        }
    }
}

export async function sendWithInterval(job: WorkerJob, chainId: string): Promise<void> {
    try {
        await scheduleJob(job, chainId);
    } catch (error) {
        console.log(error);
        Sentry.captureException(error);
    } finally {
        setTimeout(() => {
            sendWithInterval(job, chainId);
        }, job.interval);
    }
}

export async function scheduleJob(job: WorkerJob, chainId: string) {
    initRequestScopedContext();
    setRequestScopedContextValue('chainId', chainId);
    switch (job.name) {
        case 'sync-changed-pools':
            await runIfNotAlreadyRunning(job.name, chainId, () => poolService.syncChangedPools(), defaultSamplingRate);
            break;
        case 'user-sync-wallet-balances-for-all-pools':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => userService.syncChangedWalletBalancesForAllPools(),
                defaultSamplingRate,
            );
            break;
        case 'user-sync-staked-balances':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => userService.syncChangedStakedBalances(),
                defaultSamplingRate,
            );
            break;
        case 'load-token-prices':
            await runIfNotAlreadyRunning(job.name, chainId, () => tokenService.loadTokenPrices(), defaultSamplingRate);
            break;
        case 'update-liquidity-for-active-pools':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.updateLiquidityValuesForPools(),
                defaultSamplingRate,
            );
            break;
        case 'update-liquidity-for-inactive-pools':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.updateLiquidityValuesForPools(0, 0.00000000001),
                defaultSamplingRate,
            );
            break;
        case 'update-pool-apr':
            await runIfNotAlreadyRunning(job.name, chainId, () => poolService.updatePoolAprs(), defaultSamplingRate);
            break;
        case 'load-on-chain-data-for-pools-with-active-updates':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.loadOnChainDataForPoolsWithActiveUpdates(),
                defaultSamplingRate,
            );
            break;
        case 'sync-new-pools-from-subgraph':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.syncNewPoolsFromSubgraph(),
                defaultSamplingRate,
            );
            break;
        case 'sync-sanity-pool-data':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.syncPoolContentData(),
                defaultSamplingRate,
            );
            break;
        case 'sync-tokens-from-pool-tokens':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => tokenService.syncTokenContentData(),
                defaultSamplingRate,
            );
            break;
        case 'update-liquidity-24h-ago-for-all-pools':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.updateLiquidity24hAgoForAllPools(),
                defaultSamplingRate,
            );
            break;
        case 'sync-fbeets-ratio':
            await runIfNotAlreadyRunning(job.name, chainId, () => beetsService.syncFbeetsRatio(), defaultSamplingRate);
            break;
        case 'cache-average-block-time':
            await runIfNotAlreadyRunning(job.name, chainId, () => blocksSubgraphService.cacheAverageBlockTime(), 0.001);
            break;
        case 'sync-global-coingecko-prices':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => tokenService.syncCoingeckoPricesForAllChains(),
                defaultSamplingRate,
            );
            break;
        case 'sync-staking-for-pools':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.syncStakingForPools(),
                defaultSamplingRate,
            );
            break;
        case 'cache-protocol-data':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => protocolService.cacheProtocolMetrics(),
                defaultSamplingRate,
            );
            break;
        case 'sync-latest-snapshots-for-all-pools':
            await runIfNotAlreadyRunning(job.name, chainId, () => poolService.syncLatestSnapshotsForAllPools(), 0.01);
            break;
        case 'update-lifetime-values-for-all-pools':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.updateLifetimeValuesForAllPools(),
                defaultSamplingRate,
            );
            break;
        case 'sync-user-snapshots':
            await runIfNotAlreadyRunning(job.name, chainId, () => userService.syncUserBalanceSnapshots(), 0.01);
            break;
        case 'feed-data-to-datastudio':
            await runIfNotAlreadyRunning(job.name, chainId, () => datastudioService.feedPoolData(), 0.0);
            break;
        case 'sync-latest-reliquary-snapshots':
            await runIfNotAlreadyRunning(
                job.name,
                chainId,
                () => poolService.syncLatestReliquarySnapshotsForAllFarms(),
                0.01,
            );
            break;
        case 'sync-latest-relic-snapshots':
            await runIfNotAlreadyRunning(job.name, chainId, () => userService.syncUserRelicSnapshots(), 0.01);
            break;
        case 'purge-old-tokenprices':
            await runIfNotAlreadyRunning(job.name, chainId, () => tokenService.purgeOldTokenPrices(), 0.01);
            break;
        case 'sync-coingecko-coinids':
            await runIfNotAlreadyRunning(job.name, chainId, () => tokenService.syncCoingeckoIds(), 0.01);
            break;
        default:
            throw new Error(`Unhandled job type ${job.name}`);
    }
}
