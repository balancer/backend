import {
    SftmxController,
    SnapshotsController,
    UserBalancesController,
    CowAmmController,
    ContentController,
    FXPoolsController,
    PoolController,
    EventController,
    StakingController,
    StakedSonicController,
    TokenController,
    QuantAmmController,
    TokenYieldsController,
} from '../modules/controllers';
import { chainIdToChain } from '../modules/network/chain-id-to-chain';
import { tokenService } from '../modules/token/token.service';
import { VeBalVotingListService } from '../modules/vebal/vebal-voting-list.service';
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { upsertLastSyncedBlock } from '../modules/actions/last-synced-block';
import { prisma } from '../prisma/prisma-client';
import { LBPController } from '../modules/controllers/lbp-controller';
import { request, gql } from 'graphql-request';
import _ from 'lodash';
import { AprService } from '../modules/aprs';
import { PricingService } from '../modules/pricing';
import { LoopsService } from '../modules/loops/service';
import { userService } from '../modules/user/user.service';
import { veBalService } from '../modules/vebal/vebal.service';

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
        await EventController().syncLastSwaps(chain);
        await syncCurrentPricesFromApi(chain);

        await PoolController().updateLiquidityValuesForInactivePools(chain);

        return 'OK';
    } else if (job === 'sor-sync-v3') {
        console.log('Syncing V3 pools');
        await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, 0);
        await PoolController().addPoolsV3(chain, false);
        await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3, 0);
        await PoolController().syncPoolsV3(chain);

        console.log('Syncing pools metadata');
        await ContentController().syncCategories();

        console.log('Syncing Erc4626');
        await ContentController().syncTokenContentData();
        await ContentController().syncErc4626Data();
        await TokenController().syncErc4626OnChainData(chain);

        console.log('Syncing token prices');
        await EventController().syncLastSwaps(chain);
        await syncCurrentPricesFromApi(chain);

        await PoolController().updateLiquidityValuesForInactivePools(chain);

        return 'OK';
    } else if (job === 'add-pools-v3') {
        return PoolController().addPoolsV3(chain);
    } else if (job === 'sync-token-content-data') {
        await ContentController().syncTokenContentData();
    } else if (job === 'sync-pools-v3') {
        return PoolController().syncPoolsV3(chain);
    } else if (job === 'update-liquidity-for-inactive-pools') {
        return PoolController().updateLiquidityValuesForInactivePools(chain);
    } else if (job === 'sync-staking') {
        return StakingController().syncStaking(chain);
    } else if (job === 'sync-join-exits-v3') {
        return EventController().syncJoinExitsV3(chain);
    } else if (job === 'sync-join-exits-v2') {
        return EventController().syncJoinExitsV2(chain);
    } else if (job === 'sync-swaps-v2') {
        return EventController().syncSwapsUpdateVolumeAndFeesV2(chain);
    } else if (job === 'sync-snapshots') {
        return SnapshotsController().syncSnapshots(chain);
    } else if (job === 'sync-swaps-v3') {
        return EventController().syncSwapsV3(chain);
    } else if (job === 'update-volume-and-fees') {
        return EventController().updateVolumeAndFees(chain);
    } else if (job === 'update-liquidity-24h-ago-v3') {
        return PoolController().updateLiquidity24hAgoV3(chain);
    } else if (job === 'sync-sftmx-staking') {
        return SftmxController().syncSftmxStakingData(chain);
    } else if (job === 'sync-sftmx-withdrawal') {
        return SftmxController().syncSftmxWithdrawalrequests(chain);
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
    } else if (job === 'sync-cow-amm-swaps') {
        return CowAmmController().syncSwaps(chain);
    } else if (job === 'sync-cow-amm-join-exits') {
        return CowAmmController().syncJoinExits(chain);
    } else if (job === 'sync-cow-amm-balances') {
        return CowAmmController().syncBalances(chain);
    } else if (job === 'sync-categories') {
        return ContentController().syncCategories();
    } else if (job === 'sync-latest-fx-prices') {
        return FXPoolsController().syncLatestPrices(chain);
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
    } else if (job === 'sync-loops-data') {
        return new LoopsService().fetchAndStoreLoopsData(chain);
    } else if (job === 'reload-pool-aprs') {
        const aprService = new AprService();
        return aprService.reloadAprs(chain);
    } else if (job === 'update-pool-aprs') {
        const aprService = new AprService();
        const chain = chainIdToChain[chainId];
        const id = process.argv[4];
        if (id) {
            return aprService.updateAprForPool(chain, id);
        } else {
            return aprService.updateAprs(chain);
        }
    } else if (job === 'update-prices') {
        // await tokenService.syncTokenContentData(chain);
        // await TokenController().syncErc4626Tokens(chain);
        // await TokenController().syncErc4626OnChainData(chain);
        const service = new PricingService([chain]);
        return service.updatePrices(chain);
    } else if (job === 'update-erc4626-tokens') {
        await TokenController().syncErc4626Tokens(chain);
        await TokenController().syncErc4626OnChainData(chain);
        const service = new PricingService([chain]);
        return service.updatePrices(chain);
    } else if (job === 'sync-vebal') {
        return new VeBalVotingListService().syncVotingGauges();
    } else if (job === 'sync-token-tvl') {
        return TokenController().syncTvl();
    } else if (job === 'sync-erc4626') {
        return TokenController().syncErc4626OnChainData(chain);
    } else if (job === 'sync-weights') {
        await QuantAmmController.syncWeights(chain);
        return 'OK';
    } else if (job === 'sync-lbps') {
        await LBPController.syncData(chain);
        return 'OK';
    } else if (job === 'sync-token-yields') {
        await TokenYieldsController().fetchAndStoreAllYields();
        return 'OK';
    } else if (job === 'sync-staked-balances') {
        await userService.syncChangedStakedBalances(chain);
        return 'OK';
    } else if (job === 'sync-vebal-balances') {
        await veBalService.syncVeBalBalances(chain);
        return 'OK';
    } else if (job === 'sync-vebal-totalsupply') {
        await veBalService.syncVeBalTotalSupply(chain);
        return 'OK';
    }
    // Maintenance
    else if (job === 'sync-onchain-data-v2') {
        const poolIds = process.argv[4]?.split(',');
        if (poolIds) {
            await PoolController().syncOnchainDataForPoolsV2(chain, poolIds);
        } else {
            await PoolController().syncOnchainDataForPoolsV2(chain);
        }
        return 'OK';
    } else if (job === 'sync-fx-quote-tokens') {
        return FXPoolsController().syncQuoteTokens(chain);
    } else if (job === 'sync-current-prices') {
        await syncCurrentPricesFromApi(chain);

        return 'OK';
    } else if (job === 'sync-historical-prices') {
        console.log('Syncing all pools and tokens first');
        // await PoolController().addPoolsV2(chain);
        // await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, 0);
        // await PoolController().addPoolsV3(chain, false);
        // await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.COW_AMM_POOLS, 0);
        // await CowAmmController().syncPools(chain);

        // get all current prices first to
        const endpoint = 'https://api-v3.balancer.fi/graphql';
        const currentPricesQuery = gql`
            {
                tokenGetCurrentPrices(chains: [${chain}]) {
                    address
                }
            }
        `;

        const currentPricesResp = (await request(endpoint, currentPricesQuery, {}, {})) as {
            tokenGetCurrentPrices: {
                address: string;
            }[];
        };

        const addressChunks = _.chunk(
            currentPricesResp.tokenGetCurrentPrices.map((price) => price.address),
            50,
        );

        const allHistoricalPrices = [];

        let tokensLoaded = 0;
        for (const chunk of addressChunks) {
            const tokensList = `"${chunk.join('","')}"`;

            const historicalPricesQuery = gql`
                {
                    tokenGetHistoricalPrices(
                        chain: MAINNET
                        range: SEVEN_DAY
                        addresses: [${tokensList}]
                    ) {
                        address
                        chain
                        prices {
                            price
                            timestamp
                            updatedBy
                        }
                    }
                }
            `;

            const historicalPricesResp = (await request(endpoint, historicalPricesQuery, {}, {})) as {
                tokenGetHistoricalPrices: {
                    address: string;
                    chain: string;
                    prices: {
                        price: number;
                        timestamp: string;
                        updatedBy: string;
                    }[];
                }[];
            };

            tokensLoaded += historicalPricesResp.tokenGetHistoricalPrices.length;
            console.log(`Tokens loaded: ${tokensLoaded}/${currentPricesResp.tokenGetCurrentPrices.length}`);
            allHistoricalPrices.push(...historicalPricesResp.tokenGetHistoricalPrices);
        }

        let failed = 0;
        for (const token of allHistoricalPrices) {
            try {
                for (const price of token.prices) {
                    await prisma.prismaTokenPrice.upsert({
                        where: {
                            tokenAddress_timestamp_chain: {
                                tokenAddress: token.address,
                                timestamp: parseFloat(price.timestamp),
                                chain: token.chain as Chain,
                            },
                        },
                        update: {
                            price: price.price,
                            close: price.price,
                            updatedBy: price.updatedBy,
                        },
                        create: {
                            tokenAddress: token.address,
                            chain: token.chain as Chain,
                            timestamp: parseFloat(price.timestamp),
                            price: price.price,
                            high: price.price,
                            low: price.price,
                            open: price.price,
                            close: price.price,
                            updatedBy: price.updatedBy,
                        },
                    });
                }
            } catch (e) {
                console.error('Error inserting historical price for token: ', token.address);
                failed++;
            }
        }
        console.log('Total prices to insert: ', allHistoricalPrices.length);
        console.log('Failed to insert prices: ', failed);
        console.log('Successful inserted prices: ', allHistoricalPrices.length - failed);

        return 'OK';
    }
    return Promise.reject(new Error(`Unknown job: ${job}`));
}

run()
    .then((r) => console.log(r))
    .then(() => process.exit(0))
    .catch((e) => console.error(e));

async function syncCurrentPricesFromApi(chain: Chain) {
    const endpoint = 'https://api-v3.balancer.fi/graphql';

    const query = gql`
            {
                tokenGetCurrentPrices(chains: [${chain}]) {
                    address
                    price
                    chain
                    updatedAt
                    updatedBy
                }
            }
        `;

    const resp = (await request(endpoint, query, {}, {})) as {
        tokenGetCurrentPrices: {
            address: string;
            price: number;
            chain: string;
            updatedAt: number;
            updatedBy: string;
        }[];
    };

    console.log('Deleting old current prices');
    await prisma.prismaTokenCurrentPrice.deleteMany({
        where: {
            chain: chain,
        },
    });

    console.log('Inserting new current prices: ', resp.tokenGetCurrentPrices.length);
    let failed = 0;

    for (const token of resp.tokenGetCurrentPrices) {
        try {
            await prisma.prismaTokenCurrentPrice.upsert({
                where: {
                    tokenAddress_chain: {
                        tokenAddress: token.address,
                        chain: token.chain as Chain,
                    },
                },
                update: {
                    price: token.price,
                    timestamp: token.updatedAt,
                    updatedBy: token.updatedBy,
                },
                create: {
                    tokenAddress: token.address,
                    chain: token.chain as Chain,
                    price: token.price,
                    timestamp: token.updatedAt,
                    updatedBy: token.updatedBy,
                },
            });
        } catch (e) {
            console.error('Error inserting current price for token: ', token.address);
            failed++;
        }
    }
    console.log('Total prices to insert: ', resp.tokenGetCurrentPrices.length);
    console.log('Failed to insert prices: ', failed);
    console.log('Successful inserted prices: ', resp.tokenGetCurrentPrices.length - failed);
}
