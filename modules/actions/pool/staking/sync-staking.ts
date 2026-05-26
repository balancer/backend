import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { ReliquarySubgraphService } from '../../../subgraphs/reliquary-subgraph/reliquary.service';
import { GaugeSubgraphService } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import {
    deleteReliquaryStakingForAllPools,
    syncReliquaryStakingForPools,
    loadReliquarySnapshotsForAllFarms,
} from './sync-reliquary-staking.service';
import { deleteGaugeStakingForAllPools, syncGaugeStakingForPools } from './sync-gauge-staking.service';
import { syncVebalStakingForPools } from './sync-vebal-staking';
import config from '../../../../config';

export const syncStaking = async (chains: Chain[]) => {
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

        if (chain === 'MAINNET') {
            await syncVebalStakingForPools();
        }
    }
};

export const reloadStakingForAllPools = async (stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> => {
    const networkconfig = config[chain];
    await deleteReliquaryStakingForAllPools(stakingTypes, chain);
    await deleteGaugeStakingForAllPools(stakingTypes, chain);

    // if we reload staking for reliquary, we also need to reload the snapshots because they are deleted while reloading
    if (stakingTypes.includes('RELIQUARY')) {
        loadReliquarySnapshotsForAllFarms(
            chain,
            networkconfig.subgraphs.reliquary,
            networkconfig.reliquary?.excludedFarmIds || [],
        );
    }
    // reload it for all pools
    await syncStaking([chain]);
};
