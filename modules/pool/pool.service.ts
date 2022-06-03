import { PoolCreatorService } from './src/pool-creator.service';
import { PoolOnChainDataService } from './src/pool-on-chain-data.service';
import { env } from '../../app/env';
import { prisma } from '../util/prisma-client';
import { providers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import _ from 'lodash';
import { PoolUsdDataService } from './src/pool-usd-data.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import moment from 'moment-timezone';
import {
    GqlPoolJoinExit,
    GqlPoolMinimal,
    GqlPoolUnion,
    GqlPoolUserSwapVolume,
    QueryPoolGetBatchSwapsArgs,
    QueryPoolGetJoinExitsArgs,
    QueryPoolGetPoolsArgs,
    QueryPoolGetSwapsArgs,
    QueryPoolGetUserSwapVolumeArgs,
} from '../../schema';
import { PoolGqlLoaderService } from './src/pool-gql-loader.service';
import { PoolSanityDataLoaderService } from './src/pool-sanity-data-loader.service';
import { PoolAprUpdaterService } from './src/pool-apr-updater.service';
import { SwapFeeAprService } from './apr-data-sources/swap-fee-apr.service';
import { MasterchefFarmAprService } from './apr-data-sources/masterchef-farm-apr.service';
import { SpookySwapAprService } from './apr-data-sources/spooky-swap-apr.service';
import { YearnVaultAprService } from './apr-data-sources/yearn-vault-apr.service';
import { PoolSyncService } from './src/pool-sync.service';
import { tokenService } from '../token/token.service';
import { PhantomStableAprService } from './apr-data-sources/phantom-stable-apr.service';
import { BoostedPoolAprService } from './apr-data-sources/boosted-pool-apr.service';
import { PrismaPoolFilter, PrismaPoolSwap, PrismaPoolBatchSwap } from '@prisma/client';
import { PoolSwapService } from './src/pool-swap.service';
import { PoolStakingService } from './pool-types';
import { MasterChefStakingService } from './staking/master-chef-staking.service';
import { masterchefService } from '../subgraphs/masterchef-subgraph/masterchef.service';
import { networkConfig } from '../config/network-config';
import { PrismaPoolBatchSwapWithSwaps } from '../../prisma/prisma-types';

export class PoolService {
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

    public async getPoolBatchSwaps(args: QueryPoolGetBatchSwapsArgs): Promise<PrismaPoolBatchSwapWithSwaps[]> {
        return this.poolSwapService.getBatchSwaps(args);
    }

    public async getPoolJoinExits(args: QueryPoolGetJoinExitsArgs): Promise<GqlPoolJoinExit[]> {
        return this.poolSwapService.getJoinExits(args);
    }

    public async getPoolUserSwapVolume(args: QueryPoolGetUserSwapVolumeArgs): Promise<GqlPoolUserSwapVolume[]> {
        return this.poolSwapService.getUserSwapVolume(args);
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
            await this.syncSwapsForLast24Hours();
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

    public async updateLiquidityValuesForAllPools(): Promise<void> {
        await this.poolUsdDataService.updateLiquidityValuesForAllPools();
    }

    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]): Promise<void> {
        console.time('updateVolumeAndFeeValuesForPools');
        await this.poolUsdDataService.updateVolumeAndFeeValuesForPools(poolIds);
        console.timeEnd('updateVolumeAndFeeValuesForPools');
    }

    public async syncSwapsForLast24Hours(): Promise<string[]> {
        console.time('syncSwapsForLast24Hours');
        const poolIds = await this.poolSwapService.syncSwapsForLast24Hours();
        console.timeEnd('syncSwapsForLast24Hours');

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
}

export const poolService = new PoolService(
    new providers.JsonRpcProvider(env.RPC_URL),
    new PoolCreatorService(),
    new PoolOnChainDataService(networkConfig.multicall, networkConfig.balancer.vault, tokenService),
    new PoolUsdDataService(tokenService),
    new PoolGqlLoaderService(),
    new PoolSanityDataLoaderService(),
    //TODO: this will depend on the chain
    new PoolAprUpdaterService([
        //order matters for the boosted pool aprs: linear, phantom stable, then boosted
        new SpookySwapAprService(tokenService),
        new YearnVaultAprService(tokenService),
        new PhantomStableAprService(),
        new BoostedPoolAprService(),
        new SwapFeeAprService(),
        new MasterchefFarmAprService(),
    ]),
    new PoolSyncService(),
    new PoolSwapService(tokenService, balancerSubgraphService),
    new MasterChefStakingService(masterchefService),
);
