import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { AllNetworkConfigsKeyedOnChain } from '../../../network/network-config';
import { MasterchefSubgraphService } from '../../../subgraphs/masterchef-subgraph/masterchef.service';
import { ReliquarySubgraphService } from '../../../subgraphs/reliquary-subgraph/reliquary.service';
import { GaugeSubgraphService } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { AuraSubgraphService } from '../../../sources/subgraphs/aura/aura.service';
import { deleteMasterchefStakingForAllPools, syncMasterchefStakingForPools } from './sync-master-chef-staking.service';
import {
    deleteReliquaryStakingForAllPools,
    syncReliquaryStakingForPools,
    loadReliquarySnapshotsForAllFarms,
} from './sync-reliquary-staking.service';
import { deleteGaugeStakingForAllPools, syncGaugeStakingForPools } from './sync-gauge-staking.service';
import { deleteAuraStakingForAllPools, syncAuraStakingForPools } from './sync-aura-staking';
import { syncVebalStakingForPools } from './sync-vebal-staking';

export const syncStaking = async (chains: Chain[]) => {
    for (const chain of chains) {
        const networkconfig = AllNetworkConfigsKeyedOnChain[chain];
        if (networkconfig.data.subgraphs.masterchef) {
            await syncMasterchefStakingForPools(
                chain,
                new MasterchefSubgraphService(networkconfig.data.subgraphs.masterchef),
                networkconfig.data.masterchef?.excludedFarmIds || [],
                networkconfig.data.fbeets?.address || '',
                networkconfig.data.fbeets?.farmId || '',
                networkconfig.data.fbeets?.poolId || '',
            );
        }
        if (networkconfig.data.subgraphs.reliquary) {
            await syncReliquaryStakingForPools(
                chain,
                new ReliquarySubgraphService(networkconfig.data.subgraphs.reliquary),
                networkconfig.data.reliquary?.address || '',
                networkconfig.data.reliquary?.excludedFarmIds || [],
            );
        }
        if (networkconfig.data.subgraphs.gauge && networkconfig.data.bal?.address) {
            await syncGaugeStakingForPools(
                new GaugeSubgraphService(networkconfig.data.subgraphs.gauge),
                networkconfig.data.bal.address,
            );
        }
        if (networkconfig.data.subgraphs.aura) {
            await syncAuraStakingForPools(chain, new AuraSubgraphService(networkconfig.data.subgraphs.aura));
        }

        if (chain === 'MAINNET') {
            await syncVebalStakingForPools();
        }
    }
};

export const reloadStakingForAllPools = async (stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> => {
    const networkconfig = AllNetworkConfigsKeyedOnChain[chain];
    await deleteMasterchefStakingForAllPools(stakingTypes, chain);
    await deleteReliquaryStakingForAllPools(stakingTypes, chain);
    await deleteGaugeStakingForAllPools(stakingTypes, chain);
    await deleteAuraStakingForAllPools(stakingTypes, chain);

    // if we reload staking for reliquary, we also need to reload the snapshots because they are deleted while reloading
    if (stakingTypes.includes('RELIQUARY')) {
        loadReliquarySnapshotsForAllFarms(
            chain,
            networkconfig.data.subgraphs.reliquary,
            networkconfig.data.reliquary?.excludedFarmIds || [],
        );
    }
    // reload it for all pools
    await syncStaking([chain]);
};
