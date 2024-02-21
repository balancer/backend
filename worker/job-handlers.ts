import * as Sentry from '@sentry/node';
import { Express, NextFunction } from 'express';
import { tokenService } from '../modules/token/token.service';
import { poolService } from '../modules/pool/pool.service';
import { beetsService } from '../modules/beets/beets.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { userService } from '../modules/user/user.service';
import { protocolService } from '../modules/protocol/protocol.service';
import { datastudioService } from '../modules/datastudio/datastudio.service';
import { initRequestScopedContext, setRequestScopedContextValue } from '../modules/context/request-scoped-context';
import { networkContext } from '../modules/network/network-context.service';
import { veBalService } from '../modules/vebal/vebal.service';
import { veBalVotingListService } from '../modules/vebal/vebal-voting-list.service';
import { cronsMetricPublisher } from '../modules/metrics/metrics.client';
import moment from 'moment';
import { cronsDurationMetricPublisher } from '../modules/metrics/cron-duration-metrics.client';
import { syncLatestFXPrices } from '../modules/token/latest-fx-price';
import { AllNetworkConfigs } from '../modules/network/network-config';
import { sftmxService } from '../modules/sftmx/sftmx.service';
import { JobsController } from '../modules/controllers/jobs-controller';

const runningJobs: Set<string> = new Set();

const jobsController = JobsController();

async function runIfNotAlreadyRunning(
    id: string,
    chainId: string,
    fn: () => any,
    res: any,
    next: NextFunction,
): Promise<void> {
    const jobId = `${id}-${chainId}`;
    if (runningJobs.has(jobId)) {
        if (process.env.AWS_ALERTS === 'true') {
            await cronsMetricPublisher.publish(`${jobId}-skip`);
        }
        console.log(`Skip job ${jobId}-skip`);
        res.sendStatus(200);
        return;
    }

    const sentryTags = {
        job: id,
        chainId,
    };

    const sentryTransaction = Sentry.startTransaction({
        op: 'http',
        name: `POST /${jobId}`,
        tags: sentryTags,
    });

    Sentry.configureScope((scope) => scope.setSpan(sentryTransaction));

    const sentryChildSpan = sentryTransaction.startChild({
        op: 'background-job',
        description: `Running job ${jobId}`,
        tags: sentryTags,
    });

    const startJobTime = moment();
    try {
        runningJobs.add(jobId);

        console.time(jobId);
        console.log(`Start job ${jobId}-start`);

        await fn();

        const durationSuccess = moment.duration(moment().diff(startJobTime)).asSeconds();
        if (process.env.AWS_ALERTS === 'true') {
            await cronsMetricPublisher.publish(`${jobId}-done`);
            await cronsDurationMetricPublisher.publish(`${jobId}-done`, durationSuccess);
        }
        console.log(`Successful job ${jobId}-done`);
    } catch (error) {
        Sentry.captureException(error);

        const durationError = moment.duration(moment().diff(startJobTime)).asSeconds();
        if (process.env.AWS_ALERTS === 'true') {
            await cronsMetricPublisher.publish(`${jobId}-error`);
            await cronsDurationMetricPublisher.publish(`${jobId}-error`, durationError);
        }
        console.log(`Error job ${jobId}-error`, error);
        next(error);
    } finally {
        sentryChildSpan.finish();
        sentryTransaction.finish();

        runningJobs.delete(jobId);
        console.timeEnd(jobId);
        res.sendStatus(200);
    }
}

export function configureWorkerRoutes(app: Express) {
    app.post('/', async (req, res, next) => {
        const job = req.body as { name: string; chain: string };

        console.log(`Current jobqueue length: ${runningJobs.size}`);
        const chainId = job.chain;
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        switch (job.name) {
            case 'sync-changed-pools':
                await runIfNotAlreadyRunning(job.name, chainId, () => poolService.syncChangedPools(), res, next);
                break;

            case 'sync-changed-pools-v3':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => jobsController.addMissingPoolsFromSubgraph(chainId),
                    res,
                    next,
                );
                break;
            case 'user-sync-wallet-balances-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => userService.syncChangedWalletBalancesForAllPools(),
                    res,
                    next,
                );
                break;
            case 'user-sync-staked-balances':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => userService.syncChangedStakedBalances(),
                    res,
                    next,
                );
                break;
            case 'update-token-prices':
                await runIfNotAlreadyRunning(job.name, chainId, () => tokenService.updateTokenPrices(), res, next);
                break;
            case 'update-liquidity-for-active-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateLiquidityValuesForPools(),
                    res,
                    next,
                );
                break;
            case 'update-liquidity-for-inactive-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateLiquidityValuesForPools(0, 0.00000000001),
                    res,
                    next,
                );
                break;
            case 'update-pool-apr':
                await runIfNotAlreadyRunning(job.name, chainId, () => poolService.updatePoolAprs(), res, next);
                break;
            case 'load-on-chain-data-for-pools-with-active-updates':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.loadOnChainDataForPoolsWithActiveUpdates(),
                    res,
                    next,
                );
                break;
            case 'load-on-chain-data-for-pools-with-active-updates-v3':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.loadOnChainDataForPoolsWithActiveUpdatesV3(),
                    res,
                    next,
                );
                break;
            case 'sync-new-pools-from-subgraph':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.syncNewPoolsFromSubgraph(),
                    res,
                    next,
                );
                break;
            case 'sync-new-pools-from-subgraph-v3':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.syncNewPoolsFromSubgraphV3(),
                    res,
                    next,
                );
                break;
            case 'sync-sanity-pool-data':
                await runIfNotAlreadyRunning(job.name, chainId, () => poolService.syncPoolContentData(), res, next);
                break;
            case 'sync-tokens-from-pool-tokens':
                await runIfNotAlreadyRunning(job.name, chainId, () => tokenService.syncTokenContentData(), res, next);
                break;
            case 'update-liquidity-24h-ago-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateLiquidity24hAgoForAllPools(),
                    res,
                    next,
                );
                break;
            case 'update-liquidity-24h-ago-for-all-pools-v3':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateLiquidity24hAgoForAllPoolsV3(),
                    res,
                    next,
                );
                break;
            case 'cache-average-block-time':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => blocksSubgraphService.cacheAverageBlockTime(),
                    res,
                    next,
                );
                break;
            case 'sync-global-coingecko-prices':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => tokenService.syncCoingeckoPricesForAllChains(),
                    res,
                    next,
                );
                break;
            case 'sync-staking-for-pools':
                await runIfNotAlreadyRunning(job.name, chainId, () => poolService.syncStakingForPools(), res, next);
                break;
            case 'cache-protocol-data':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => protocolService.cacheProtocolMetrics(networkContext.chain),
                    res,
                    next,
                );
                break;
            case 'sync-latest-snapshots-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.syncLatestSnapshotsForAllPools(),
                    res,
                    next,
                );
                break;
            case 'sync-latest-snapshots-for-all-pools-v3':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.syncLatestSnapshotsForAllPoolsV3(),
                    res,
                    next,
                );
                break;
            case 'update-lifetime-values-for-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateLifetimeValuesForAllPools(),
                    res,
                    next,
                );
                break;
            case 'update-lifetime-values-for-all-pools-v3':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateLifetimeValuesForAllPoolsV3(),
                    res,
                    next,
                );
                break;
            case 'feed-data-to-datastudio':
                await runIfNotAlreadyRunning(job.name, chainId, () => datastudioService.feedPoolData(), res, next);
                break;
            case 'sync-latest-reliquary-snapshots':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.syncLatestReliquarySnapshotsForAllFarms(),
                    res,
                    next,
                );
                break;
            case 'global-purge-old-tokenprices':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => tokenService.purgeOldTokenPricesForAllChains(),
                    res,
                    next,
                );
                break;
            case 'sync-coingecko-coinids':
                await runIfNotAlreadyRunning(job.name, chainId, () => tokenService.syncCoingeckoIds(), res, next);
                break;
            case 'update-fee-volume-yield-all-pools':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => poolService.updateFeeVolumeYieldForAllPools(),
                    res,
                    next,
                );
                break;
            case 'sync-vebal-balances':
                await runIfNotAlreadyRunning(job.name, chainId, () => veBalService.syncVeBalBalances(), res, next);
                break;
            case 'sync-vebal-totalSupply':
                await runIfNotAlreadyRunning(job.name, chainId, () => veBalService.syncVeBalTotalSupply(), res, next);
                break;
            case 'sync-vebal-voting-gauges':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => veBalVotingListService.syncVotingGauges(),
                    res,
                    next,
                );
                break;
            case 'sync-latest-fx-prices':
                await runIfNotAlreadyRunning(
                    job.name,
                    chainId,
                    () => {
                        const config = AllNetworkConfigs[chainId].data;
                        const subgraphUrl = config.subgraphs.balancer;
                        const chain = config.chain.prismaId;
                        return syncLatestFXPrices(subgraphUrl, chain);
                    },
                    res,
                    next,
                );
                break;
            case 'sync-sftmx-staking-data':
                await runIfNotAlreadyRunning(job.name, chainId, () => sftmxService.syncStakingData(), res, next);
                break;
            case 'sync-sftmx-withdrawal-requests':
                await runIfNotAlreadyRunning(job.name, chainId, () => sftmxService.syncWithdrawalRequests(), res, next);
                break;
            default:
                res.sendStatus(400);
                throw new Error(`Unhandled job type ${job.name}`);
        }
    });
}
