import * as Sentry from '@sentry/node';
import { Express } from 'express';
import { tokenService } from '../modules/token/token.service';
import { poolService } from '../modules/pool/pool.service';
import { beetsService } from '../modules/beets/beets.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { userService } from '../modules/user/user.service';
import { WorkerJob } from './manual-jobs';
import { protocolService } from '../modules/protocol/protocol.service';

const runningJobs: Set<string> = new Set();

async function runIfNotAlreadyRunning(id: string, fn: () => any): Promise<void> {
    if (runningJobs.has(id)) {
        console.log('Skipping job', id);
        return;
    }
    runningJobs.add(id);
    try {
        console.time(id);
        console.log(`Start job ${id}`);
        await fn();
    } finally {
        runningJobs.delete(id);
        console.timeEnd(id);
        console.log(`Finished job ${id}`);
    }
}

export function configureWorkerRoutes(app: Express) {
    // all manual triggered (e.g. fast running) jobs will be handled here
    app.post('/', async (req, res, next) => {
        const job = req.body as WorkerJob;
        Sentry.configureScope((scope) => scope.setTransactionName(`POST /${job.type} - manual`));
        try {
            switch (job.type) {
                case 'sync-pools':
                    await runIfNotAlreadyRunning(job.type, () => poolService.syncChangedPools());
                    break;
                case 'user-sync-wallet-balances-for-all-pools':
                    await runIfNotAlreadyRunning(job.type, () => userService.syncWalletBalancesForAllPools());
                    break;
                case 'user-sync-staked-balances':
                    await runIfNotAlreadyRunning(job.type, () => userService.syncStakedBalances());
                    break;
                default:
                    throw new Error(`Unhandled job type ${job.type}`);
            }
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });

    app.post('/load-token-prices', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('load-token-prices', () => tokenService.loadTokenPrices());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });

    app.post('/update-liquidity-for-all-pools', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('update-liquidity-for-all-pools', () =>
                poolService.updateLiquidityValuesForAllPools(),
            );
            res.sendStatus(200);
        } catch (error) {
            console.log(error);
            next(error);
        }
    });
    app.post('/update-pool-apr', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('update-pool-apr', () => poolService.updatePoolAprs());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/load-on-chain-data-for-pools-with-active-updates', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('load-on-chain-data-for-pools-with-active-updates', () =>
                poolService.loadOnChainDataForPoolsWithActiveUpdates(),
            );
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-new-pools-from-subgraph', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-new-pools-from-subgraph', () => poolService.syncNewPoolsFromSubgraph());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-sanity-pool-data', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-sanity-pool-data', () => poolService.syncSanityPoolData());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-tokens-from-pool-tokens', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-tokens-from-pool-tokens', () => tokenService.syncSanityData());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-liquidity-24h-ago-for-all-pools', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('update-liquidity-24h-ago-for-all-pools', () =>
                poolService.updateLiquidity24hAgoForAllPools(),
            );
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-fbeets-ratio', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-fbeets-ratio', () => beetsService.syncFbeetsRatio());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/cache-average-block-time', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('cache-average-block-time', () =>
                blocksSubgraphService.cacheAverageBlockTime(),
            );
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });

    app.post('/sync-token-dynamic-data', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-token-dynamic-data', () => tokenService.syncTokenDynamicData());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-staking-for-pools', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-staking-for-pools', () => poolService.syncStakingForPools());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/cache-protocol-data', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('cache-protocol-data', () => protocolService.cacheProtocolMetrics());
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-latest-snapshots-for-all-pools', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('sync-latest-snapshots-for-all-pools', () =>
                poolService.syncLatestSnapshotsForAllPools(),
            );
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-lifetime-values-for-all-pools', async (req, res, next) => {
        try {
            await runIfNotAlreadyRunning('update-lifetime-values-for-all-pools', () =>
                poolService.updateLifetimeValuesForAllPools(),
            );
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    // app.post('/sync-changed-pools', async (req, res, next) => {
    //     try {
    //         console.log('Sync changed pools');
    //         await  runpoolService.syncChangedPools();
    //         console.log('Sync changed pools done');
    //         res.sendStatus(200);
    //     } catch (error) {
    //         next(error);
    //     }
    // });
    // app.post('/user-sync-wallet-balances-for-all-pools', async (req, res, next) => {
    //     try {
    //         console.log('User sync wallet balances for all pools');
    //         await userService.syncWalletBalancesForAllPools();
    //         console.log('User sync wallet balances for all pools done');
    //         res.sendStatus(200);
    //     } catch (error) {
    //         next(error);
    //     }
    // });
    // app.post('/user-sync-staked-balances', async (req, res, next) => {
    //     try {
    //         console.log('User sync staked balances');
    //         await userService.syncStakedBalances();
    //         console.log('User sync staked balances done');
    //         res.sendStatus(200);
    //     } catch (error) {
    //         next(error);
    //     }
    // });
}
