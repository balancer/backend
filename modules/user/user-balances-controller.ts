import { Chain, PrismaPoolStaking, PrismaPoolStakingType } from '@prisma/client';
import config from '../../config';
import { syncBptBalancesCowAmm } from './lib/bpt-balances/sync-bpt-balances-cow-amm';
import { syncBptBalancesV2 } from './lib/bpt-balances/sync-bpt-balances-v2';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';
import { syncBptBalancesV3 } from './lib/bpt-balances/sync-bpt-balances-v3';
import { UserPoolBalance } from './user-types';
import { getUserPoolBalances, getUserStaking } from './lib/user-balances';

export function UserBalancesController() {
    return {
        async syncBalances(chain: Chain) {
            const {
                subgraphs: { balancer, balancerV3, cowAmm },
            } = config[chain];

            // Run all syncs in parallel
            await Promise.all([
                syncBptBalancesV2(chain, balancer),
                syncBptBalancesV3(chain, balancerV3),
                syncBptBalancesCowAmm(chain, cowAmm),
            ]);

            return true;
        },
        async syncUserBalancesFromV2Subgraph(chain: Chain) {
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const syncedBlocks = await syncBptBalancesV2(chain, balancer);
            return syncedBlocks;
        },
        async syncUserBalancesFromV3Subgraph(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                return [];
            }

            const syncedBlocks = await syncBptBalancesV3(chain, balancerV3);
            return syncedBlocks;
        },

        async getUserPoolBalances(address: string, chains: Chain[]): Promise<UserPoolBalance[]> {
            return getUserPoolBalances(address, chains);
        },

        async getUserStaking(address: string, chains: Chain[]): Promise<PrismaPoolStaking[]> {
            return getUserStaking(address, chains);
        },

        async initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain) {
            await Promise.all(
                AllNetworkConfigsKeyedOnChain[chain].userStakedBalanceServices.map((service) =>
                    service.initStakedBalances(stakingTypes, chain),
                ),
            );
        },

        async syncChangedStakedBalances(chain: Chain) {
            await Promise.all(
                AllNetworkConfigsKeyedOnChain[chain].userStakedBalanceServices.map((service) =>
                    service.syncChangedStakedBalances(chain),
                ),
            );
        },
    };
}
