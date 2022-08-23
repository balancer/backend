import { PoolCreatorService } from './lib/pool-creator.service';
import { PoolOnChainDataService } from './lib/pool-on-chain-data.service';
import { prisma } from '../../prisma/prisma-client';
import { Provider } from '@ethersproject/providers';
import _ from 'lodash';
import { PoolUsdDataService } from './lib/pool-usd-data.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import moment from 'moment-timezone';
import {
    GqlPoolBatchSwap,
    GqlPoolFeaturedPoolGroup,
    GqlPoolJoinExit,
    GqlPoolMinimal,
    GqlPoolSnapshotDataRange,
    GqlPoolUnion,
    GqlPoolUserSwapVolume,
    QueryPoolGetBatchSwapsArgs,
    QueryPoolGetJoinExitsArgs,
    QueryPoolGetPoolsArgs,
    QueryPoolGetSwapsArgs,
    QueryPoolGetUserSwapVolumeArgs,
} from '../../schema';
import { PoolGqlLoaderService } from './lib/pool-gql-loader.service';
import { PoolSanityDataLoaderService } from './lib/pool-sanity-data-loader.service';
import { PoolAprUpdaterService } from './lib/pool-apr-updater.service';
import { SwapFeeAprService } from './lib/apr-data-sources/swap-fee-apr.service';
import { MasterchefFarmAprService } from './lib/apr-data-sources/fantom/masterchef-farm-apr.service';
import { SpookySwapAprService } from './lib/apr-data-sources/fantom/spooky-swap-apr.service';
import { YearnVaultAprService } from './lib/apr-data-sources/fantom/yearn-vault-apr.service';
import { PoolSyncService } from './lib/pool-sync.service';
import { tokenService } from '../token/token.service';
import { PhantomStableAprService } from './lib/apr-data-sources/phantom-stable-apr.service';
import { BoostedPoolAprService } from './lib/apr-data-sources/boosted-pool-apr.service';
import { PrismaPoolFilter, PrismaPoolSwap } from '@prisma/client';
import { PoolSwapService } from './lib/pool-swap.service';
import { PoolStakingService } from './pool-types';
import { MasterChefStakingService } from './lib/staking/fantom/master-chef-staking.service';
import { masterchefService } from '../subgraphs/masterchef-subgraph/masterchef.service';
import { isFantomNetwork, networkConfig } from '../config/network-config';
import { userService } from '../user/user.service';
import { jsonRpcProvider } from '../web3/contract';
import { configService } from '../content/content.service';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { PoolSnapshotService } from './lib/pool-snapshot.service';
import { GaugeStakingService } from './lib/staking/optimism/gauge-staking.service';
import { Cache } from 'memory-cache';
import { gaugeSerivce } from './lib/staking/optimism/gauge-service';
import { GaugeAprService } from './lib/apr-data-sources/optimism/ve-bal-guage-apr.service';
import { coingeckoService } from '../coingecko/coingecko.service';
import { StaderStakedFtmAprService } from './lib/apr-data-sources/fantom/stader-staked-ftm-apr.service';

const FEATURED_POOL_GROUPS_CACHE_KEY = 'pool:featuredPoolGroups';

export class PoolService {
    private cache = new Cache<string, any>();
    constructor(
        private readonly provider: Provider,
        private readonly poolCreatorService: PoolCreatorService,
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolUsdDataService: PoolUsdDataService,
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
        private readonly poolSanityDataLoaderService: PoolSanityDataLoaderService,
        private readonly poolAprUpdaterService: PoolAprUpdaterService,
        private readonly poolSyncService: PoolSyncService,
        private readonly poolSwapService: PoolSwapService,
        private readonly poolStakingService: PoolStakingService,
        private readonly poolSnapshotService: PoolSnapshotService,
    ) {}

    public async getGqlPool(id: string): Promise<GqlPoolUnion> {
        return this.poolGqlLoaderService.getPool(id);
    }

    public async getGqlPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolMinimal[]> {
        return this.poolGqlLoaderService.getPools(args);
    }

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return this.poolGqlLoaderService.getPoolsCount(args);
    }

    public async getPoolFilters(): Promise<PrismaPoolFilter[]> {
        return prisma.prismaPoolFilter.findMany({});
    }

    public async getPoolSwaps(args: QueryPoolGetSwapsArgs): Promise<PrismaPoolSwap[]> {
        return this.poolSwapService.getSwaps(args);
    }

    public async getPoolBatchSwaps(args: QueryPoolGetBatchSwapsArgs): Promise<GqlPoolBatchSwap[]> {
        const batchSwaps = await this.poolSwapService.getBatchSwaps(args);
        const poolIds = batchSwaps.map((batchSwap) => batchSwap.swaps.map((swap) => swap.poolId)).flat();
        const pools = await this.getGqlPools({ where: { idIn: poolIds } });

        return batchSwaps.map((batchSwap) => ({
            ...batchSwap,
            swaps: batchSwap.swaps.map((swap) => {
                const pool = pools.find((pool) => pool.id === swap.poolId)!;
                if (!pool) {
                    console.log(
                        `Missing pool for swap ${JSON.stringify(swap)} in batchSwap ${JSON.stringify(batchSwap)}`,
                    );
                }
                return {
                    ...swap,
                    pool,
                };
            }),
        }));
    }

    public async getPoolJoinExits(args: QueryPoolGetJoinExitsArgs): Promise<GqlPoolJoinExit[]> {
        return this.poolSwapService.getJoinExits(args);
    }

    public async getPoolUserSwapVolume(args: QueryPoolGetUserSwapVolumeArgs): Promise<GqlPoolUserSwapVolume[]> {
        return this.poolSwapService.getUserSwapVolume(args);
    }

    public async getFeaturedPoolGroups(): Promise<GqlPoolFeaturedPoolGroup[]> {
        const cached: GqlPoolFeaturedPoolGroup[] = await this.cache.get(FEATURED_POOL_GROUPS_CACHE_KEY);

        if (cached) {
            return cached;
        }

        const featuredPoolGroups = await this.poolGqlLoaderService.getFeaturedPoolGroups();

        this.cache.put(FEATURED_POOL_GROUPS_CACHE_KEY, featuredPoolGroups, 60 * 5 * 1000);

        return featuredPoolGroups;
    }

    public async getSnapshotsForPool(poolId: string, range: GqlPoolSnapshotDataRange) {
        return this.poolSnapshotService.getSnapshotsForPool(poolId, range);
    }

    public async syncAllPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await this.provider.getBlockNumber();

        return this.poolCreatorService.syncAllPoolsFromSubgraph(blockNumber);
    }

    public async reloadStakingForAllPools(): Promise<void> {
        return this.poolStakingService.reloadStakingForAllPools();
    }

    public async syncPoolAllTokensRelationship(): Promise<void> {
        const pools = await prisma.prismaPool.findMany({ select: { id: true } });

        for (const pool of pools) {
            await this.poolCreatorService.createAllTokensRelationshipForPool(pool.id);
        }
    }

    public async syncNewPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await this.provider.getBlockNumber();

        const poolIds = await this.poolCreatorService.syncNewPoolsFromSubgraph(blockNumber);

        if (poolIds.length > 0) {
            await this.updateOnChainDataForPools(poolIds, blockNumber);
            await this.syncSwapsForLast48Hours();
            await this.updateVolumeAndFeeValuesForPools(poolIds);
        }

        return poolIds;
    }

    public async loadOnChainDataForAllPools(): Promise<void> {
        const result = await prisma.prismaPool.findMany({ select: { id: true } });
        const poolIds = result.map((item) => item.id);
        const blockNumber = await this.provider.getBlockNumber();

        const chunks = _.chunk(poolIds, 100);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainData(chunk, this.provider, blockNumber);
        }
    }

    public async updateOnChainDataForPools(poolIds: string[], blockNumber: number) {
        await this.poolOnChainDataService.updateOnChainData(poolIds, this.provider, blockNumber);
    }

    public async loadOnChainDataForPoolsWithActiveUpdates() {
        const blockNumber = await this.provider.getBlockNumber();
        const timestamp = moment().subtract(5, 'minutes').unix();
        console.time('getPoolsWithActiveUpdates');
        const poolIds = await balancerSubgraphService.getPoolsWithActiveUpdates(timestamp);
        console.timeEnd('getPoolsWithActiveUpdates');

        console.time('updateOnChainData');
        await this.poolOnChainDataService.updateOnChainData(poolIds, this.provider, blockNumber);
        console.timeEnd('updateOnChainData');
    }

    public async updateLiquidityValuesForPools(minShares?: number, maxShares?: number): Promise<void> {
        await this.poolUsdDataService.updateLiquidityValuesForPools(minShares, maxShares);
    }

    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]): Promise<void> {
        console.time('updateVolumeAndFeeValuesForPools');
        await this.poolUsdDataService.updateVolumeAndFeeValuesForPools(poolIds);
        console.timeEnd('updateVolumeAndFeeValuesForPools');
    }

    public async syncSwapsForLast48Hours(): Promise<string[]> {
        console.time('syncSwapsForLast48Hours');
        const poolIds = await this.poolSwapService.syncSwapsForLast48Hours();
        console.timeEnd('syncSwapsForLast48Hours');

        return poolIds;
    }

    public async syncSanityPoolData() {
        await this.poolSanityDataLoaderService.syncPoolSanityData();
    }

    public async syncStakingForPools() {
        await this.poolStakingService.syncStakingForPools();
    }

    public async updatePoolAprs() {
        await this.poolAprUpdaterService.updatePoolAprs();
    }

    public async syncChangedPools() {
        await this.poolSyncService.syncChangedPools();
    }

    public async realodAllPoolAprs() {
        await this.poolAprUpdaterService.realodAllPoolAprs();
    }

    public async updateLiquidity24hAgoForAllPools() {
        await this.poolUsdDataService.updateLiquidity24hAgoForAllPools();
    }

    public async loadSnapshotsForAllPools() {
        await prisma.prismaPoolSnapshot.deleteMany({});
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                },
            },
        });
        const chunks = _.chunk(pools, 10);

        for (const chunk of chunks) {
            const poolIds = chunk.map((pool) => pool.id);
            await this.poolSnapshotService.loadAllSnapshotsForPools(poolIds);
        }
    }

    public async syncLatestSnapshotsForAllPools(daysToSync?: number) {
        await this.poolSnapshotService.syncLatestSnapshotsForAllPools(daysToSync);
    }

    public async updateLifetimeValuesForAllPools() {
        await this.poolUsdDataService.updateLifetimeValuesForAllPools();
    }

    public async createPoolSnapshotsForPoolsMissingSubgraphData(poolId: string) {
        await this.poolSnapshotService.createPoolSnapshotsForPoolsMissingSubgraphData(poolId);
    }

    public async reloadPoolNestedTokens(poolId: string) {
        await this.poolCreatorService.reloadPoolNestedTokens(poolId);
    }
}

export const poolService = new PoolService(
    jsonRpcProvider,
    new PoolCreatorService(userService),
    new PoolOnChainDataService(networkConfig.multicall, networkConfig.balancer.vault, tokenService),
    new PoolUsdDataService(tokenService, blocksSubgraphService, balancerSubgraphService),
    new PoolGqlLoaderService(configService),
    new PoolSanityDataLoaderService(),
    new PoolAprUpdaterService([
        //order matters for the boosted pool aprs: linear, phantom stable, then boosted
        ...(isFantomNetwork()
            ? [
                  new SpookySwapAprService(tokenService),
                  new YearnVaultAprService(tokenService),
                  new StaderStakedFtmAprService(tokenService),
              ]
            : []),
        new PhantomStableAprService(),
        new BoostedPoolAprService(),
        new SwapFeeAprService(),
        ...(isFantomNetwork()
            ? [new MasterchefFarmAprService()]
            : [
                  new GaugeAprService(gaugeSerivce, tokenService, [
                      networkConfig.beets.address,
                      networkConfig.bal.address,
                  ]),
              ]),
    ]),
    new PoolSyncService(),
    new PoolSwapService(tokenService, balancerSubgraphService),
    isFantomNetwork() ? new MasterChefStakingService(masterchefService) : new GaugeStakingService(gaugeSerivce),
    new PoolSnapshotService(balancerSubgraphService, coingeckoService),
);
