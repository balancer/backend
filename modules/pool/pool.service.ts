import { Chain, PrismaPoolFilter, PrismaPoolStakingType } from '@prisma/client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prisma } from '../../prisma/prisma-client';
import {
    GqlChain,
    GqlPoolAggregator,
    GqlPoolFeaturedPool,
    GqlPoolMinimal,
    GqlPoolSnapshotDataRange,
    GqlPoolUnion,
    QueryPoolGetPoolsArgs,
} from '../../apps/api/gql/generated-schema';
import { tokenService } from '../token/token.service';
import { PoolAprUpdaterService } from './lib/pool-apr-updater.service';
import { PoolGqlLoaderService } from './lib/pool-gql-loader.service';
import { PoolOnChainDataService, PoolOnChainDataServiceOptions } from './lib/pool-on-chain-data.service';
import { PoolSnapshotService } from './lib/pool-snapshot.service';
import { networkContext } from '../network/network-context.service';
import { ReliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { ReliquarySnapshotService } from './lib/reliquary-snapshot.service';
import { coingeckoDataService } from '../token/lib/coingecko-data.service';
import { syncIncentivizedCategory } from '../actions/pool/sync-incentivized-category';
import {
    deleteGaugeStakingForAllPools,
    deleteMasterchefStakingForAllPools,
    deleteReliquaryStakingForAllPools,
    loadReliquarySnapshotsForAllFarms,
    syncGaugeStakingForPools,
    syncMasterchefStakingForPools,
    syncReliquaryStakingForPools,
} from '../actions/pool/staking';
import { MasterchefSubgraphService } from '../subgraphs/masterchef-subgraph/masterchef.service';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { deleteAuraStakingForAllPools, syncAuraStakingForPools } from '../actions/pool/staking/sync-aura-staking';
import { AuraSubgraphService } from '../sources/subgraphs/aura/aura.service';
import { syncVebalStakingForPools } from '../actions/pool/staking/sync-vebal-staking';
import config from '../../config';

export class PoolService {
    constructor(
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
        private readonly poolAprUpdaterService: PoolAprUpdaterService,
        private readonly poolSnapshotService: PoolSnapshotService,
    ) {}

    private get chain() {
        return networkContext.chain;
    }
    private get balancerSubgraphService() {
        return networkContext.services.balancerSubgraphService;
    }

    public async getGqlPool(fields: any, id: string, chain: GqlChain, userAddress?: string): Promise<GqlPoolUnion> {
        return this.poolGqlLoaderService.getPool(fields, id, chain, userAddress);
    }

    public async getGqlPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolMinimal[]> {
        return this.poolGqlLoaderService.getPools(args);
    }

    public async getAggregatorPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolAggregator[]> {
        return this.poolGqlLoaderService.getAggregatorPools(args);
    }

    public async aggregatorPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolAggregator[]> {
        return this.poolGqlLoaderService.aggregatorPools(args);
    }

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return this.poolGqlLoaderService.getPoolsCount(args);
    }

    public async getPoolFilters(): Promise<PrismaPoolFilter[]> {
        return prisma.prismaPoolFilter.findMany({ where: { chain: this.chain } });
    }

    public async getFeaturedPools(chains: Chain[]): Promise<GqlPoolFeaturedPool[]> {
        return this.poolGqlLoaderService.getFeaturedPools(chains);
    }

    public async getSnapshotsForPool(poolId: string, chain: Chain, range: GqlPoolSnapshotDataRange) {
        return this.poolSnapshotService.getSnapshotsForPool(poolId, chain, range);
    }

    public async getSnapshotsForReliquaryFarm(id: number, range: GqlPoolSnapshotDataRange, chain: Chain) {
        if (config[chain].subgraphs.reliquary) {
            const reliquarySnapshotService = new ReliquarySnapshotService(
                new ReliquarySubgraphService(config[chain].subgraphs.reliquary),
            );

            return reliquarySnapshotService.getSnapshotsForFarm(id, range);
        }
        return [];
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        await deleteMasterchefStakingForAllPools(stakingTypes, chain);
        await deleteReliquaryStakingForAllPools(stakingTypes, chain);
        await deleteGaugeStakingForAllPools(stakingTypes, chain);
        await deleteAuraStakingForAllPools(stakingTypes, chain);

        // if we reload staking for reliquary, we also need to reload the snapshots because they are deleted while reloading
        if (stakingTypes.includes('RELIQUARY')) {
            this.loadReliquarySnapshotsForAllFarms(chain);
        }
        // reload it for all pools
        await this.syncStakingForPools([this.chain]);
    }

    public async loadOnChainDataForPoolsWithActiveUpdates() {
        const blockNumber = await networkContext.provider.getBlockNumber();
        const timestamp = moment().subtract(5, 'minutes').unix();
        const poolIds = await this.balancerSubgraphService.getPoolsWithActiveUpdates(timestamp);
        const tokenPrices = await tokenService.getTokenPrices(this.chain);

        await this.poolOnChainDataService.updateOnChainData(poolIds, this.chain, blockNumber, tokenPrices);
    }

    /**
     * Deprecated in favor of StakingController().syncStaking(chain)
     */
    public async syncStakingForPools(chains: Chain[]) {
        for (const chain of chains) {
            const networkconfig = config[chain];
            if (networkconfig.subgraphs.masterchef) {
                await syncMasterchefStakingForPools(
                    chain,
                    new MasterchefSubgraphService(networkconfig.subgraphs.masterchef),
                    networkconfig.masterchef?.excludedFarmIds || [],
                    networkconfig.fbeets?.address || '',
                    networkconfig.fbeets?.farmId || '',
                    networkconfig.fbeets?.poolId || '',
                );
            }
            if (networkconfig.subgraphs.reliquary) {
                await syncReliquaryStakingForPools(
                    chain,
                    new ReliquarySubgraphService(networkconfig.subgraphs.reliquary),
                    networkconfig.reliquary?.address || '',
                    networkconfig.reliquary?.excludedFarmIds || [],
                );
            }
            if (networkconfig.subgraphs.gauge && networkconfig.bal?.address) {
                await syncGaugeStakingForPools(
                    new GaugeSubgraphService(networkconfig.subgraphs.gauge),
                    networkconfig.bal.address,
                    chain,
                    networkconfig.gaugeControllerAddress,
                );
            }
            if (networkconfig.subgraphs.aura) {
                await syncAuraStakingForPools(chain, new AuraSubgraphService(networkconfig.subgraphs.aura));
            }

            if (chain === 'MAINNET') {
                await syncVebalStakingForPools();
            }
        }
    }

    public async updatePoolAprs(chain: Chain) {
        await this.poolAprUpdaterService.updatePoolAprs(chain);
        await syncIncentivizedCategory();
    }

    public async reloadAllPoolAprs(chain: Chain) {
        await this.poolAprUpdaterService.reloadAllPoolAprs(chain);
        await syncIncentivizedCategory();
    }

    public async syncLatestReliquarySnapshotsForAllFarms(chain: Chain) {
        if (config[chain].subgraphs.reliquary) {
            const reliquarySnapshotService = new ReliquarySnapshotService(
                new ReliquarySubgraphService(config[chain].subgraphs.reliquary),
            );
            await reliquarySnapshotService.syncLatestSnapshotsForAllFarms();
        }
    }

    public async loadReliquarySnapshotsForAllFarms(chain: Chain) {
        loadReliquarySnapshotsForAllFarms(
            chain,
            config[chain].subgraphs.reliquary,
            config[chain].reliquary?.excludedFarmIds,
        );
    }
}

const optionsResolverForPoolOnChainDataService: () => PoolOnChainDataServiceOptions = () => {
    return {
        chain: networkContext.chain,
        vaultAddress: networkContext.data.balancer.v2.vaultAddress,
        balancerQueriesAddress: networkContext.data.balancer.v2.balancerQueriesAddress,
        yieldProtocolFeePercentage: networkContext.data.balancer.v2.defaultSwapFeePercentage,
        swapProtocolFeePercentage: networkContext.data.balancer.v2.defaultSwapFeePercentage,
        gyroConfig: networkContext.data.gyro?.config,
    };
};

export const poolService = new PoolService(
    new PoolOnChainDataService(optionsResolverForPoolOnChainDataService),
    new PoolGqlLoaderService(),
    new PoolAprUpdaterService(),
    new PoolSnapshotService(coingeckoDataService),
);
