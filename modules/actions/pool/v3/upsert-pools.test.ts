import { getVaultClient } from '../../../sources/contracts';
import { getPoolsClient } from '../../../sources/contracts';
import { upsertPools } from './upsert-pools';
import { chainIdToChain } from '../../../network/chain-id-to-chain';
import config from '../../../../config';
import { getV3JoinedSubgraphClient } from '../../../sources/subgraphs/joined-client';
import { getViemClient } from '../../../sources/viem-client';
import { getPoolsSubgraphClient, getVaultSubgraphClient } from '../../../sources/subgraphs';

describe('upsert pools debug', () => {
    it('upsert boosted pool', async () => {
        const chain = chainIdToChain[11155111];
        const {
            subgraphs: { balancerV3, balancerPoolsV3 },
            balancer: {
                v3: { vaultAddress },
            },
        } = config[chain];

        // Guard against unconfigured chains
        if (!balancerV3 || !balancerPoolsV3 || !vaultAddress) {
            throw new Error(`Chain not configured: ${chain}`);
        }

        const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
        const poolsSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3, chain);
        const client = getV3JoinedSubgraphClient(vaultSubgraphClient, poolsSubgraphClient);
        const allPools = await client.getAllInitializedPools();
        const pools = allPools.filter(
            (pool) =>
                pool.id === '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c' || // fully boosted
                pool.id === '0x03bf996c7bd45b3386cb41875761d45e27eab284', // non-boosted
        );

        const viemClient = getViemClient(chain);
        const vaultClient = getVaultClient(viemClient, vaultAddress);
        const poolsClient = getPoolsClient(viemClient);
        const latestBlock = await viemClient.getBlockNumber().then(Number);

        await upsertPools(pools, vaultClient, poolsClient, chain, latestBlock);
    }, 5000000);
});
