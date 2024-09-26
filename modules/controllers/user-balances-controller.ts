import config from '../../config';
import { prisma } from '../../prisma/prisma-client';
import { upsertBptBalancesV2 } from '../actions/user/upsert-bpt-balances-v2';
import { upsertBptBalancesV3 } from '../actions/user/upsert-bpt-balances-v3';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getVaultSubgraphClient } from '../sources/subgraphs';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';

export function UserBalancesController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncUserBalancesFromV2Subgraph(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const poolIds = await prisma.prismaPool
                .findMany({ where: { chain }, select: { id: true } })
                .then((pools) => pools.map((pool) => pool.id));

            const subgraphClient = getV2SubgraphClient(balancer, Number(chainId));
            const entries = await upsertBptBalancesV2(poolIds, subgraphClient, chain);
            return entries;
        },
        async syncUserBalancesFromV3Subgraph(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await upsertBptBalancesV3(vaultSubgraphClient, chain);
            return entries;
        },
    };
}
