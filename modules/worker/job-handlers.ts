import * as Sentry from '@sentry/node';
import { Express } from 'express';
import { tokenService } from '../token/token.service';
import { tokenPriceService } from '../token-price/token-price.service';
import { poolService } from '../pool/pool.service';
import { beetsService } from '../beets/beets.service';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { balancerSdk } from '../balancer-sdk/src/balancer-sdk';
import { userService } from '../user/user.service';
import { WorkerJob } from './manual-jobs';

export function configureWorkerRoutes(app: Express) {
    // all manual triggered (e.g. fast running) jobs will be handled here
    app.post('/', async (req, res, next) => {
        const job = req.body as WorkerJob;
        console.log('Received manual job', job);
        Sentry.configureScope((scope) => scope.setTransactionName(`POST /${job.type} - manual`));
        switch (job.type) {
            case 'sync-pools':
                await poolService.syncChangedPools();
                break;
        }
    });

    app.post('/load-token-prices', async (req, res, next) => {
        try {
            console.log('Load token prices');
            await tokenService.loadTokenPrices();
            console.log('Load token prices done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });

    app.post('/load-beets-price', async (req, res, next) => {
        try {
            console.log('Load beets price');
            await tokenPriceService.cacheBeetsPrice();
            console.log('Load beets price done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-liquidity-for-all-pools', async (req, res, next) => {
        try {
            console.log('Update liquidity for all pools');
            await poolService.updateLiquidityValuesForAllPools();
            console.log('Update liquidity for all pools done');
            res.sendStatus(200);
        } catch (error) {
            console.log(error);
            next(error);
        }
    });
    app.post('/update-pool-apr', async (req, res, next) => {
        try {
            console.log('Update pool apr');
            await poolService.updatePoolAprs();
            console.log('Update pool apr done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/load-on-chain-data-for-pools-with-active-updates', async (req, res, next) => {
        try {
            console.log('Load on chain data for pools with active updates');
            await poolService.loadOnChainDataForPoolsWithActiveUpdates();
            console.log('Load on chain data for pools with active updates done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-new-pools-from-subgraph', async (req, res, next) => {
        try {
            console.log('Sync new pools from subgraph');
            await poolService.syncNewPoolsFromSubgraph();
            console.log('Sync new pools from subgraph done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-sanity-pool-data', async (req, res, next) => {
        try {
            console.log('Sync sanity pool data');
            await poolService.syncSanityPoolData();
            console.log('Sync sanity pool data done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-tokens-from-pool-tokens', async (req, res, next) => {
        try {
            console.log('Sync tokens from pool tokens');
            await tokenService.syncSanityData();
            console.log('Sync tokens from pool tokens done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-liquidity-24h-ago-for-all-pools', async (req, res, next) => {
        try {
            console.log('Update liquidity 24h ago for all pools');
            await poolService.updateLiquidity24hAgoForAllPools();
            console.log('Update liquidity 24h ago for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-fbeets-ratio', async (req, res, next) => {
        try {
            console.log('Sync fbeets ratio');
            await beetsService.syncFbeetsRatio();
            console.log('Sync fbeets ratio done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/cache-average-block-time', async (req, res, next) => {
        try {
            console.log('Cache average block time');
            await blocksSubgraphService.cacheAverageBlockTime();
            console.log('Cache average block time done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sor-reload-graph', async (req, res, next) => {
        try {
            console.log('SOR reload graph');
            await balancerSdk.sor.reloadGraph();
            console.log('SOR reload graph done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-token-dynamic-data', async (req, res, next) => {
        try {
            console.log('Sync token dynamic data');
            await tokenService.syncTokenDynamicData();
            console.log('Sync token dynamic data done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-staking-for-pools', async (req, res, next) => {
        try {
            console.log('Sync staking for pools');
            await poolService.syncStakingForPools();
            console.log('Sync staking for pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/cache-protocol-data', async (req, res, next) => {
        try {
            console.log('Cache protocol data');
            await beetsService.cacheProtocolData();
            console.log('Cache protocol data done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-latest-snapshots-for-all-pools', async (req, res, next) => {
        try {
            console.log('Sync latest snapshots for all pools');
            await poolService.syncLatestSnapshotsForAllPools();
            console.log('Sync latest snapshots for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-lifetime-values-for-all-pools', async (req, res, next) => {
        try {
            console.log('Update lifetime values for all pools');
            await poolService.updateLifetimeValuesForAllPools();
            console.log('Update lifetime values for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-changed-pools', async (req, res, next) => {
        try {
            console.log('Sync changed pools');
            await poolService.syncChangedPools();
            console.log('Sync changed pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/user-sync-wallet-balances-for-all-pools', async (req, res, next) => {
        try {
            console.log('User sync wallet balances for all pools');
            await userService.syncWalletBalancesForAllPools();
            console.log('User sync wallet balances for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/user-sync-staked-balances', async (req, res, next) => {
        try {
            console.log('User sync staked balances');
            await userService.syncStakedBalances();
            console.log('User sync staked balances done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
}
