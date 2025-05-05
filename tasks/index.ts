import moment from 'moment';
import {
    SftmxController,
    SnapshotsController,
    UserBalancesController,
    CowAmmController,
    AprsController,
    ContentController,
    FXPoolsController,
    PoolController,
    EventController,
    PoolMutationController,
    StakingController,
    StakedSonicController,
    TokenController,
    QuantAmmController,
} from '../modules/controllers';
import { PoolAprUpdaterService } from '../modules/pool/lib/pool-apr-updater.service';
import { chainIdToChain } from '../modules/network/chain-id-to-chain';

import { backsyncSwaps } from './subgraph-syncing/backsync-swaps';
import { poolService } from '../modules/pool/pool.service';
import { initRequestScopedContext, setRequestScopedContextValue } from '../modules/context/request-scoped-context';
import { tokenService } from '../modules/token/token.service';
import { VeBalVotingListService } from '../modules/vebal/vebal-voting-list.service';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import { upsertLastSyncedBlock } from '../modules/actions/last-synced-block';
import { prisma } from '../prisma/prisma-client';
import { syncLastSwaps } from '../modules/actions/pool/v3/sync-last-swaps';
import { LBPController } from '../modules/controllers/lbp-controller';

// TODO needed?
const sftmxController = SftmxController();
const snapshotsController = SnapshotsController();

/**
 * Used to run jobs or mutations locally from the command line
 * e.g. `yarn task sync-pools-v3 11155111`
 *
 * @param job
 * @param chain
 * @returns
 */
async function run(job: string = process.argv[2], chainId: string = process.argv[3]) {
    console.log('Running job', job, chainId);

    const chain = chainIdToChain[chainId];

    if (job === 'add-pools-v2') {
        return PoolController().addPoolsV2(chain);
    } else if (job === 'sync-all-pools-v2') {
        return PoolController().syncOnchainDataForAllPoolsV2(chain);
    } else if (job === 'sync-changed-pools-v2') {
        return PoolController().syncChangedPoolsV2(chain);
    } else if (job === 'reload-pools-v3') {
        await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, 0);
        return PoolController().addPoolsV3(chain, false);
    } else if (job === 'sor-sync-v2') {
        console.log('Syncing V2 pools');
        await PoolController().addPoolsV2(chain);
        await PoolController().syncOnchainDataForAllPoolsV2(chain);

        console.log('Syncing pools metadata');
        await ContentController().syncCategories();
        await ContentController().syncRateProviderReviews();

        console.log('Syncing token prices');
        await tokenService.updateTokenPrices([chain]);
        await EventController().syncLastSwaps(chain);
        await tokenService.updateTokenPrices([chain]);

        await PoolController().updateLiquidityValuesForActivePools(chain);

        return 'OK';
    } else if (job === 'sor-sync-v3') {
        console.log('Syncing V3 pools');
        await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, 0);
        await PoolController().addPoolsV3(chain, false);

        console.log('Syncing pools metadata');
        await ContentController().syncCategories();

        console.log('Syncing Erc4626');
        await tokenService.syncTokenContentData(chain);
        await ContentController().syncErc4626Data();
        await TokenController().syncErc4626UnwrapRates(chain);

        console.log('Syncing token prices');
        await tokenService.updateTokenPrices([chain]);
        await EventController().syncLastSwaps(chain);
        await tokenService.updateTokenPrices([chain]);

        await PoolController().updateLiquidityValuesForActivePools(chain);

        return 'OK';
    } else if (job === 'add-pools-v3') {
        return PoolController().addPoolsV3(chain);
    } else if (job === 'sync-pools-v3') {
        return PoolController().syncPoolsV3(chain);
    } else if (job === 'update-liquidity-for-active-pools') {
        return PoolController().updateLiquidityValuesForActivePools(chain);
    } else if (job === 'sync-staking') {
        return StakingController().syncStaking(chain);
    } else if (job === 'sync-join-exits-v3') {
        return EventController().syncJoinExitsV3(chain);
    } else if (job === 'sync-join-exits-v2') {
        return EventController().syncJoinExitsV2(chain);
    } else if (job === 'sync-swaps-v2') {
        return EventController().syncSwapsUpdateVolumeAndFeesV2(chain);
    } else if (job === 'sync-snapshots-v2') {
        return snapshotsController.syncSnapshotsV2(chain);
    } else if (job === 'fill-missing-snapshots-v2') {
        return snapshotsController.fillMissingSnapshotsV2(chain);
    } else if (job === 'sync-snapshots-v3') {
        return snapshotsController.syncSnapshotsV3(chain);
    } else if (job === 'sync-all-snapshots-v3') {
        return snapshotsController.syncAllSnapshotsV3(chain);
    } else if (job === 'forward-fill-snapshots-v3') {
        return snapshotsController.forwardFillSnapshotsForPoolsWithoutUpdatesV3(chain);
    } else if (job === 'sync-swaps-v3') {
        return EventController().syncSwapsV3(chain);
    } else if (job === 'update-liquidity-24h-ago-v3') {
        return PoolController().updateLiquidity24hAgoV3(chain);
    } else if (job === 'sync-sftmx-staking') {
        return sftmxController.syncSftmxStakingData(chain);
    } else if (job === 'sync-sftmx-withdrawal') {
        return sftmxController.syncSftmxWithdrawalrequests(chain);
    } else if (job === 'sync-sftmx-staking-snapshots') {
        return sftmxController.syncSftmxStakingSnapshots(chain);
    } else if (job === 'sync-bpt-balances') {
        return UserBalancesController().syncBalances(chain);
    } else if (job === 'sync-user-balances-v2') {
        return UserBalancesController().syncUserBalancesFromV2Subgraph(chain);
    } else if (job === 'sync-user-balances-v3') {
        return UserBalancesController().syncUserBalancesFromV3Subgraph(chain);
    } else if (job === 'sync-cow-amm-pools') {
        return CowAmmController().syncPools(chain);
    } else if (job === 'reload-cow-amm-pools') {
        await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.COW_AMM_POOLS, 0);
        return CowAmmController().syncPools(chain);
    } else if (job === 'sync-cow-amm-snapshots') {
        return CowAmmController().syncSnapshots(chain);
    } else if (job === 'sync-all-cow-amm-snapshots') {
        return CowAmmController().syncAllSnapshots(chain);
    } else if (job === 'sync-cow-amm-swaps') {
        return CowAmmController().syncSwaps(chain);
    } else if (job === 'sync-cow-amm-join-exits') {
        return CowAmmController().syncJoinExits(chain);
    } else if (job === 'update-surplus-aprs') {
        return CowAmmController().updateSurplusAprs();
    } else if (job === 'update-cow-amm-volume-and-fees') {
        return CowAmmController().updateVolumeAndFees(chain);
    } else if (job === 'sync-cow-amm-balances') {
        return CowAmmController().syncBalances(chain);
    } else if (job === 'sync-categories') {
        return ContentController().syncCategories();
    } else if (job === 'sync-latest-fx-prices') {
        return FXPoolsController().syncLatestPrices(chain);
    } else if (job === 'backsync-swaps') {
        // Run in loop until no new swaps are found
        let status: string | undefined = 'true';
        let i = 0;
        while (status) {
            console.time('backsyncSwaps page time');
            status = await backsyncSwaps(chain);
            console.timeEnd('backsyncSwaps page time');
            i += 1000;
            console.log('Processed', i, 'swaps');
        }
        return 'OK';
    } else if (job === 'sync-merkl') {
        return AprsController().syncMerkl();
    } else if (job === 'update-7-30-days-swap-apr') {
        return AprsController().update7And30DaysSwapAprs(chain);
    } else if (job === 'sync-rate-provider-reviews') {
        return ContentController().syncRateProviderReviews();
    } else if (job === 'sync-hook-reviews') {
        return ContentController().syncHookReviews();
    } else if (job === 'sync-erc4626-data') {
        return ContentController().syncErc4626Data();
    } else if (job === 'sync-tags') {
        return ContentController().syncCategories();
    } else if (job === 'sync-hook-data') {
        return PoolController().syncHookData(chain);
    } else if (job === 'sync-sts-data') {
        return StakedSonicController().syncSonicStakingData();
    } else if (job === 'reload-pool-aprs') {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
        return poolService.reloadAllPoolAprs(chain);
    } else if (job === 'update-total-apr') {
        const id = process.argv[4];
        const chain = chainIdToChain[chainId];
        const service = new PoolAprUpdaterService();
        return service.updateTotalApr(id, chain);
    } else if (job === 'update-prices') {
        await tokenService.syncTokenContentData(chain);
        return tokenService.updateTokenPrices([chain]);
    } else if (job === 'sync-vebal') {
        return new VeBalVotingListService().syncVotingGauges();
    } else if (job === 'sync-weights') {
        await QuantAmmController.syncWeights(chain);
        await LBPController.syncWeights(chain);
        return 'OK';
    }
    // Maintenance
    else if (job === 'sync-fx-quote-tokens') {
        return FXPoolsController().syncQuoteTokens(chain);
    }
    return Promise.reject(new Error(`Unknown job: ${job}`));
}

run()
    .then((r) => console.log(r))
    .then(() => process.exit(0))
    .catch((e) => console.error(e));
