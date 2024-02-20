import { PoolFragment as VaultSubgraphPoolFragment } from '../../subgraphs/balancer-v3-vault/generated/types';
import { PoolFragment as PoolSubgraphPoolFragment } from '../../subgraphs/balancer-v3-pools/generated/types';
import { Chain } from '@prisma/client';

export const poolTokensTransformer = (vaultSubgraphPool: VaultSubgraphPoolFragment) => {
    const tokens = vaultSubgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${vaultSubgraphPool.id}-${token.address}`.toLowerCase(),
        address: token.address.toLowerCase(),
        index: token.index,
        nestedPoolId: null,
        priceRateProvider: vaultSubgraphPool.rateProviders![i].address.toLowerCase(),
        exemptFromProtocolYieldFee: token.totalProtocolYieldFee === '0' ? true : false,
    }));
};

export const poolTokensDynamicDataTransformer = (
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    poolSubgraphPool: PoolSubgraphPoolFragment,
    chain: Chain,
) => {
    const tokens = vaultSubgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${vaultSubgraphPool.id}-${token.address}`.toLowerCase(),
        poolTokenId: `${vaultSubgraphPool.id}-${token.address}`.toLowerCase(),
        chain,
        blockNumber: parseFloat(vaultSubgraphPool.blockNumber),
        balance: token.balance,
        balanceUSD: 0,
        priceRate: '0',
        weight: poolSubgraphPool.weights[token.index] ?? null,
        // latestFxPrice: poolSubgraphPool.latestFxPrice,
    }));
};
