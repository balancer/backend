import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment as PoolSubgraphPoolFragment } from '../../subgraphs/balancer-v3-pools/generated/types';
import { Chain, Prisma } from '@prisma/client';

export function poolTokensTransformer(
    vaultSubgraphPool: VaultSubgraphPoolFragment,
): Prisma.PrismaPoolTokenCreateManyPoolInput[] {
    const tokens = vaultSubgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${vaultSubgraphPool.id}-${token.address}`.toLowerCase(),
        address: token.address.toLowerCase(),
        index: token.index,
        nestedPoolId: null,
        priceRateProvider: vaultSubgraphPool.rateProviders![i].address.toLowerCase(),
        exemptFromProtocolYieldFee: token.totalProtocolYieldFee === '0' ? true : false,
    }));
}

export function poolTokensDynamicDataTransformer(
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    poolSubgraphPool: PoolSubgraphPoolFragment,
    chain: Chain,
): Prisma.PrismaPoolTokenDynamicDataCreateManyInput[] {
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
}

// TODO deal with nested pools
export function poolExpandedTokensTransformer(
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    chain: Chain,
): Prisma.PrismaPoolExpandedTokensCreateManyInput[] {
    const tokens = vaultSubgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        poolId: vaultSubgraphPool.id,
        chain: chain,
        tokenAddress: token.address,
        nestedPoolId: null,
    }));
}
