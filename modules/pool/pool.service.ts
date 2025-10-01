import { Chain, PrismaPoolFilter, PrismaPoolStakingType } from '@prisma/client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prisma } from '../../prisma/prisma-client';
import {
    GqlChain,
    GqlPoolFeaturedPool,
    GqlPoolMinimal,
    GqlPoolSnapshotDataRange,
    GqlPoolUnion,
    QueryPoolGetPoolsArgs,
} from '../../apps/api/gql/generated-schema';
import { tokenService } from '../token/token.service';
import { PoolGqlLoaderService } from './lib/pool-gql-loader.service';
import { PoolOnChainDataService, PoolOnChainDataServiceOptions } from './lib/pool-on-chain-data.service';
import { networkContext } from '../network/network-context.service';
import { ReliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { ReliquarySnapshotService } from './lib/reliquary-snapshot.service';
import {
    deleteGaugeStakingForAllPools,
    deleteMasterchefStakingForAllPools,
    deleteReliquaryStakingForAllPools,
    loadReliquarySnapshotsForAllFarms,
} from '../actions/pool/staking';
import { deleteAuraStakingForAllPools } from '../actions/pool/staking/sync-aura-staking';
import config from '../../config';
import { StakingController } from '../controllers';

export class PoolService {
    constructor(
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
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

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return this.poolGqlLoaderService.getPoolsCount(args);
    }

    public async getSnapshotsForPool(poolId: string, chain: Chain, range: GqlPoolSnapshotDataRange) {
        const timestamp = this.getTimestampForRange(range);

        return prisma.prismaPoolSnapshot.findMany({
            where: { poolId, timestamp: { gt: timestamp }, chain },
            orderBy: { timestamp: 'asc' },
        });
    }

    private getTimestampForRange(range: GqlPoolSnapshotDataRange): number {
        switch (range) {
            case 'THIRTY_DAYS':
                return moment().startOf('day').subtract(30, 'days').unix();
            case 'NINETY_DAYS':
                return moment().startOf('day').subtract(90, 'days').unix();
            case 'ONE_HUNDRED_EIGHTY_DAYS':
                return moment().startOf('day').subtract(180, 'days').unix();
            case 'ONE_YEAR':
                return moment().startOf('day').subtract(365, 'days').unix();
            case 'ALL_TIME':
                return 0;
        }
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
        await StakingController().syncStaking(chain);
    }

    public async loadOnChainDataForPoolsWithActiveUpdates() {
        const blockNumber = await networkContext.provider.getBlockNumber();
        const timestamp = moment().subtract(5, 'minutes').unix();
        const poolIds = await this.balancerSubgraphService.getPoolsWithActiveUpdates(timestamp);
        const tokenPrices = await tokenService.getTokenPrices(this.chain);

        await this.poolOnChainDataService.updateOnChainData(this.chain, blockNumber, tokenPrices, poolIds);
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
);
