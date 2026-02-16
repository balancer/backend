import { Chain, PrismaPoolStakingType } from '@prisma/client';
import _ from 'lodash';
import {
    GqlChain,
    GqlPoolFeaturedPool,
    GqlPoolMinimal,
    GqlPoolSnapshotDataRange,
    GqlPoolUnion,
    QueryPoolGetPoolsArgs,
} from '../../apps/api/gql/generated-schema';
import { PoolGqlLoaderService } from './lib/pool-gql-loader.service';
import { PoolSnapshotService } from './lib/pool-snapshot.service';
import { ReliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { ReliquarySnapshotService } from './lib/reliquary-snapshot.service';
import {
    deleteGaugeStakingForAllPools,
    deleteReliquaryStakingForAllPools,
    loadReliquarySnapshotsForAllFarms,
    syncGaugeStakingForPools,
    syncReliquaryStakingForPools,
} from '../actions/pool/staking';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { deleteAuraStakingForAllPools, syncAuraStakingForPools } from '../actions/pool/staking/sync-aura-staking';
import { AuraSubgraphService } from '../sources/subgraphs/aura/aura.service';
import { syncVebalStakingForPools } from '../actions/pool/staking/sync-vebal-staking';
import config from '../../config';

export class PoolService {
    constructor(
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
        private readonly poolSnapshotService: PoolSnapshotService,
    ) {}

    public async getGqlPool(fields: any, id: string, chain: GqlChain, userAddress?: string): Promise<GqlPoolUnion> {
        return this.poolGqlLoaderService.getPool(fields, id, chain, userAddress);
    }

    public async getGqlPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolMinimal[]> {
        return this.poolGqlLoaderService.getPools(args);
    }

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return this.poolGqlLoaderService.getPoolsCount(args);
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

            return reliquarySnapshotService.getSnapshotsForFarm(id, range, chain);
        }
        return [];
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        await deleteReliquaryStakingForAllPools(stakingTypes, chain);
        await deleteGaugeStakingForAllPools(stakingTypes, chain);
        await deleteAuraStakingForAllPools(stakingTypes, chain);

        // if we reload staking for reliquary, we also need to reload the snapshots because they are deleted while reloading
        if (stakingTypes.includes('RELIQUARY')) {
            this.loadReliquarySnapshotsForAllFarms(chain);
        }
        // reload it for all pools
        await this.syncStakingForPools([chain]);
    }

    /**
     * Deprecated in favor of StakingController().syncStaking(chain)
     */
    public async syncStakingForPools(chains: Chain[]) {
        for (const chain of chains) {
            const networkconfig = config[chain];
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
                    networkconfig.gaugeControllerHelperAddress,
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

    public async syncLatestReliquarySnapshotsForAllFarms(chain: Chain) {
        if (config[chain].subgraphs.reliquary) {
            const reliquarySnapshotService = new ReliquarySnapshotService(
                new ReliquarySubgraphService(config[chain].subgraphs.reliquary),
            );
            await reliquarySnapshotService.syncLatestSnapshotsForAllFarms(chain);
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

export const poolService = new PoolService(new PoolGqlLoaderService(), new PoolSnapshotService());
