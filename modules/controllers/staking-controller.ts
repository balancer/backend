import config from '../../config';
import { Chain } from '@prisma/client';
import { syncGaugeStakingForPools, syncReliquaryStakingForPools } from '../actions/pool/staking';
import { ReliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { syncAuraStakingForPools } from '../actions/pool/staking/sync-aura-staking';
import { AuraSubgraphService } from '../sources/subgraphs/aura/aura.service';
import { syncVebalStakingForPools } from '../actions/pool/staking/sync-vebal-staking';

export function StakingController() {
    return {
        async syncStaking(chain: Chain) {
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
        },
    };
}
