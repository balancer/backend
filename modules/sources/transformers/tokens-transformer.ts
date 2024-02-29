import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain } from '@prisma/client';

type DbToken = {
    address: string;
    name: string;
    decimals: number;
    symbol: string;
    chain: Chain;
};

export function tokensTransformer(vaultSubgraphPools: VaultSubgraphPoolFragment[], chain: Chain): DbToken[] {
    const allTokens: DbToken[] = [];
    vaultSubgraphPools.forEach((pool) => {
        allTokens.push({
            address: pool.address,
            decimals: 18,
            name: pool.name,
            symbol: pool.symbol,
            chain: chain,
        });
        if (pool.tokens) {
            for (const poolToken of pool.tokens) {
                allTokens.push({
                    address: poolToken.address,
                    decimals: poolToken.decimals,
                    name: poolToken.name,
                    symbol: poolToken.symbol,
                    chain: chain,
                });
            }
        }
    });
    return allTokens;
}
