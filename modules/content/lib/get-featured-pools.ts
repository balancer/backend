import { chainIdToChain } from '../../network/chain-id-to-chain';
import { Chain } from '@prisma/client';
import { GqlChain } from '../../../apps/api/gql/generated-schema';

const POOLS_METADATA_URL = 'https://raw.githubusercontent.com/balancer/metadata/main/pools/featured.json';

interface FeaturedPoolMetadata {
    id: string;
    imageUrl: string;
    primary: boolean;
    chainId: number;
    description: string;
}

export interface FeaturedPool {
    poolId: string;
    primary: boolean;
    chain: GqlChain;
    description: string;
}

export async function getFeaturedPools(chains: Chain[]): Promise<FeaturedPool[]> {
    const response = await fetch(POOLS_METADATA_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch featured pools: ${response.statusText}`);
    }
    const data = (await response.json()) as FeaturedPoolMetadata[];
    const pools = data.filter((pool) => chains.includes(chainIdToChain[pool.chainId]));
    return pools.map(({ id, primary, chainId, description }) => ({
        poolId: id,
        chain: chainIdToChain[chainId],
        primary: Boolean(primary),
        description: description,
    })) as FeaturedPool[];
}
