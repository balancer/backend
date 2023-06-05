import { PrismaPoolFilter, PrismaPoolStakingType, PrismaPoolSwap } from '@prisma/client';
import _, { chain, includes } from 'lodash';
import { Cache } from 'memory-cache';
import moment from 'moment-timezone';
import { prisma } from '../../prisma/prisma-client';
import {
    GqlPoolBatchSwap,
    GqlPoolFeaturedPoolGroup,
    GqlPoolJoinExit,
    GqlPoolLinear,
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
import { coingeckoService } from '../coingecko/coingecko.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { tokenService } from '../token/token.service';
import { userService } from '../user/user.service';
import { PoolAprUpdaterService } from './lib/pool-apr-updater.service';
import { PoolCreatorService } from './lib/pool-creator.service';
import { PoolGqlLoaderService } from './lib/pool-gql-loader.service';
import { PoolOnChainDataService } from './lib/pool-on-chain-data.service';
import { PoolSnapshotService } from './lib/pool-snapshot.service';
import { PoolSwapService } from './lib/pool-swap.service';
import { PoolSyncService } from './lib/pool-sync.service';
import { PoolUsdDataService } from './lib/pool-usd-data.service';
import { PoolStakingService } from './pool-types';
import { networkContext } from '../network/network-context.service';
import { reliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { ReliquarySnapshotService } from './lib/reliquary-snapshot.service';
import { ContentService } from '../content/content-types';

const FEATURED_POOL_GROUPS_CACHE_KEY = `pool:featuredPoolGroups`;

export class PoolService {
    private cache = new Cache<string, any>();
    constructor(
        private readonly poolCreatorService: PoolCreatorService,
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolUsdDataService: PoolUsdDataService,
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
        private readonly poolAprUpdaterService: PoolAprUpdaterService,
        private readonly poolSyncService: PoolSyncService,
        private readonly poolSwapService: PoolSwapService,
        private readonly poolSnapshotService: PoolSnapshotService,
        private readonly reliquarySnapshotService: ReliquarySnapshotService,
    ) {}

    private get poolStakingServices(): PoolStakingService[] {
        return networkContext.config.poolStakingServices;
    }

    private get contentService(): ContentService {
        return networkContext.config.contentService;
    }

    public async getGqlPool(id: string): Promise<GqlPoolUnion> {
        return this.poolGqlLoaderService.getPool(id);
    }

    public async getGqlPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolMinimal[]> {
        return this.poolGqlLoaderService.getPools(args);
    }

    public async getGqlLinearPools(): Promise<GqlPoolLinear[]> {
        return this.poolGqlLoaderService.getLinearPools();
    }

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return this.poolGqlLoaderService.getPoolsCount(args);
    }

    public async getPoolFilters(): Promise<PrismaPoolFilter[]> {
        return prisma.prismaPoolFilter.findMany({ where: { chain: networkContext.chain } });
    }

    public async getPoolSwaps(args: QueryPoolGetSwapsArgs): Promise<PrismaPoolSwap[]> {
        return this.poolSwapService.getSwaps(args);
    }

    public async getPoolBatchSwaps(args: QueryPoolGetBatchSwapsArgs): Promise<GqlPoolBatchSwap[]> {
        const batchSwaps = await this.poolSwapService.getBatchSwaps(args);

        return batchSwaps.map((batchSwap) => ({
            ...batchSwap,
            swaps: batchSwap.swaps.map((swap) => {
                return {
                    ...swap,
                    pool: this.poolGqlLoaderService.mapToMinimalGqlPool(swap.pool),
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
        const cached: GqlPoolFeaturedPoolGroup[] = await this.cache.get(
            `${FEATURED_POOL_GROUPS_CACHE_KEY}:${networkContext.chainId}`,
        );

        if (cached) {
            return cached;
        }

        const featuredPoolGroups = await this.poolGqlLoaderService.getFeaturedPoolGroups();

        this.cache.put(
            `${FEATURED_POOL_GROUPS_CACHE_KEY}:${networkContext.chainId}`,
            featuredPoolGroups,
            60 * 5 * 1000,
        );

        return featuredPoolGroups;
    }

    public async getSnapshotsForAllPools(range: GqlPoolSnapshotDataRange) {
        return this.poolSnapshotService.getSnapshotsForAllPools(range);
    }

    public async getSnapshotsForPool(poolId: string, range: GqlPoolSnapshotDataRange) {
        return this.poolSnapshotService.getSnapshotsForPool(poolId, range);
    }

    public async getSnapshotsForReliquaryFarm(id: number, range: GqlPoolSnapshotDataRange) {
        return this.reliquarySnapshotService.getSnapshotsForFarm(id, range);
    }

    public async syncAllPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await networkContext.provider.getBlockNumber();

        return this.poolCreatorService.syncAllPoolsFromSubgraph(blockNumber);
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        await Promise.all(
            this.poolStakingServices.map((stakingService) => stakingService.reloadStakingForAllPools(stakingTypes)),
        );
        // if we reload staking for reliquary, we also need to reload the snapshots because they are deleted while reloading
        if (stakingTypes.includes('RELIQUARY')) {
            this.loadReliquarySnapshotsForAllFarms();
        }
    }

    public async syncPoolAllTokensRelationship(): Promise<void> {
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: { chain: networkContext.chain },
        });

        for (const pool of pools) {
            await this.poolCreatorService.createAllTokensRelationshipForPool(pool.id);
        }
    }

    public async syncNewPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await networkContext.provider.getBlockNumber();

        const poolIds = await this.poolCreatorService.syncNewPoolsFromSubgraph(blockNumber);

        if (poolIds.length > 0) {
            await this.updateOnChainDataForPools(poolIds, blockNumber);
            await this.syncSwapsForLast48Hours();
            await this.updateVolumeAndFeeValuesForPools(poolIds);
        }

        return poolIds;
    }

    public async loadOnChainDataForAllPools(): Promise<void> {
        const result = await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                categories: {
                    none: { category: 'BLACK_LISTED' },
                },
                chain: networkContext.chain,
            },
        });
        const poolIds = result.map((item) => item.id);
        const blockNumber = await networkContext.provider.getBlockNumber();

        const chunks = _.chunk(poolIds, 100);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainData(chunk, networkContext.provider, blockNumber);
        }
    }

    public async updateOnChainDataForPools(poolIds: string[], blockNumber: number) {
        const chunks = _.chunk(poolIds, 100);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainData(chunk, networkContext.provider, blockNumber);
        }
    }

    public async loadOnChainDataForPoolsWithActiveUpdates() {
        const blockNumber = await networkContext.provider.getBlockNumber();
        const timestamp = moment().subtract(5, 'minutes').unix();
        const poolIds = await balancerSubgraphService.getPoolsWithActiveUpdates(timestamp);

        await this.poolOnChainDataService.updateOnChainData(poolIds, networkContext.provider, blockNumber);
    }

    public async updateLiquidityValuesForPools(minShares?: number, maxShares?: number): Promise<void> {
        await this.poolUsdDataService.updateLiquidityValuesForPools(minShares, maxShares);
    }

    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]): Promise<void> {
        await this.poolUsdDataService.updateVolumeAndFeeValuesForPools(poolIds);
    }

    public async updateYieldCaptureForAllPools() {
        await this.poolUsdDataService.updateYieldCaptureForAllPools();
    }

    public async syncSwapsForLast48Hours(): Promise<string[]> {
        return this.poolSwapService.syncSwapsForLast48Hours();
    }

    public async syncPoolContentData() {
        await this.contentService.syncPoolContentData();
    }

    public async syncStakingForPools() {
        await Promise.all(this.poolStakingServices.map((stakingService) => stakingService.syncStakingForPools()));
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

    public async loadSnapshotsForPools(poolIds: string[], reload: boolean) {
        if (reload) {
            await prisma.prismaPoolSnapshot.deleteMany({
                where: { chain: networkContext.chain, poolId: { in: poolIds } },
            });
        }

        await this.poolSnapshotService.loadAllSnapshotsForPools(poolIds);
    }

    public async loadSnapshotsForAllPools() {
        await prisma.prismaPoolSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                },
                chain: networkContext.chain,
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

    public async syncLatestReliquarySnapshotsForAllFarms() {
        await this.reliquarySnapshotService.syncLatestSnapshotsForAllFarms();
    }

    public async loadReliquarySnapshotsForAllFarms() {
        await prisma.prismaReliquaryTokenBalanceSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        await prisma.prismaReliquaryLevelSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        await prisma.prismaReliquaryFarmSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        const farms = await prisma.prismaPoolStakingReliquaryFarm.findMany({ where: { chain: networkContext.chain } });
        const farmIds = farms.map((farm) => parseFloat(farm.id));
        for (const farmId of farmIds) {
            await this.reliquarySnapshotService.loadAllSnapshotsForFarm(farmId);
        }
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

    public async reloadAllTokenNestedPoolIds() {
        await this.poolCreatorService.reloadAllTokenNestedPoolIds();
    }

    public async reloadPoolTokenIndexes(poolId: string) {
        await this.poolCreatorService.reloadPoolTokenIndexes(poolId);
    }

    public async setPoolsWithPreferredGaugesAsIncentivized() {
        await this.poolSyncService.setPoolsWithPreferredGaugesAsIncentivized();
    }

    public async syncPoolVersionForAllPools() {
        const subgraphPools = await balancerSubgraphService.getAllPools({}, false);
        for (const subgraphPool of subgraphPools) {
            await prisma.prismaPool.update({
                where: { id_chain: { chain: networkContext.chain, id: subgraphPool.id } },
                data: {
                    version: subgraphPool.poolTypeVersion ? subgraphPool.poolTypeVersion : 1,
                },
            });
        }
    }

    public async addToBlackList(poolId: string) {
        const category = await prisma.prismaPoolCategory.findFirst({
            where: { poolId, chain: networkContext.chain, category: 'BLACK_LISTED' },
        });

        if (category) {
            throw new Error('Pool with id is already blacklisted');
        }

        await prisma.prismaPoolCategory.create({
            data: {
                id: `${networkContext.chain}-${poolId}-BLACK_LISTED`,
                category: 'BLACK_LISTED',
                chain: networkContext.chain,
                poolId,
            },
        });
    }

    public async removeFromBlackList(poolId: string) {
        await prisma.prismaPoolCategory.deleteMany({
            where: {
                category: 'BLACK_LISTED',
                chain: networkContext.chain,
                poolId,
            },
        });
    }

    public async deletePool(poolId: string) {
        const pool = await prisma.prismaPool.findUniqueOrThrow({
            where: { id_chain: { id: poolId, chain: networkContext.chain } },
        });

        const poolTokens = await prisma.prismaPoolToken.findMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        const poolTokenIds = poolTokens.map((poolToken) => poolToken.id);
        const poolTokenAddresses = poolTokens.map((poolToken) => poolToken.address);

        await prisma.prismaPoolSnapshot.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaTokenType.deleteMany({
            where: { chain: networkContext.chain, tokenAddress: pool.address },
        });

        await prisma.prismaUserWalletBalance.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolTokenDynamicData.deleteMany({
            where: { chain: networkContext.chain, poolTokenId: { in: poolTokenIds } },
        });

        await prisma.prismaTokenDynamicData.deleteMany({
            where: { chain: networkContext.chain, tokenAddress: { in: poolTokenAddresses } },
        });

        await prisma.prismaPoolToken.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolDynamicData.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolToken.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolLinearData.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolExpandedTokens.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolLinearDynamicData.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolAprItem.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolSwap.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        const poolStaking = await prisma.prismaPoolStaking.findMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        for (const staking of poolStaking) {
            switch (staking.type) {
                case 'GAUGE':
                    await prisma.prismaPoolStakingGaugeReward.deleteMany({
                        where: { chain: networkContext.chain, gaugeId: staking.id },
                    });

                    await prisma.prismaPoolStakingGauge.deleteMany({
                        where: { chain: networkContext.chain, stakingId: staking.id },
                    });
                    break;

                case 'MASTER_CHEF':
                    await prisma.prismaPoolStakingMasterChefFarmRewarder.deleteMany({
                        where: { chain: networkContext.chain, farmId: staking.id },
                    });

                    await prisma.prismaPoolStakingMasterChefFarm.deleteMany({
                        where: { chain: networkContext.chain, stakingId: staking.id },
                    });
                    break;
                case 'RELIQUARY':
                    await prisma.prismaPoolStakingReliquaryFarmLevel.deleteMany({
                        where: { chain: networkContext.chain, farmId: staking.id.split('-')[1] },
                    });

                    await prisma.prismaPoolStakingReliquaryFarm.deleteMany({
                        where: { chain: networkContext.chain, stakingId: staking.id },
                    });
                    break;
                default:
                    break;
            }
        }

        await prisma.prismaUserStakedBalance.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPoolStaking.deleteMany({
            where: { chain: networkContext.chain, poolId: poolId },
        });

        await prisma.prismaPool.delete({
            where: { id_chain: { id: poolId, chain: networkContext.chain } },
        });
    }
}

export const poolService = new PoolService(
    new PoolCreatorService(userService),
    new PoolOnChainDataService(tokenService),
    new PoolUsdDataService(tokenService, blocksSubgraphService, balancerSubgraphService),
    new PoolGqlLoaderService(),
    new PoolAprUpdaterService(),
    new PoolSyncService(),
    new PoolSwapService(tokenService, balancerSubgraphService),
    new PoolSnapshotService(balancerSubgraphService, coingeckoService),
    new ReliquarySnapshotService(reliquarySubgraphService),
);
