import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment as PoolSubgraphPoolFragment } from '../subgraphs/balancer-v3-pools/generated/types';
import { OnchainPoolData } from '../types';
import { Chain, Prisma } from '@prisma/client';
import { formatUnits } from 'viem';

// Comment: removing return type, because prisma doesn't export 'PrismaPoolTokenCreateManyPoolInput' type
export function poolTokensTransformer(vaultSubgraphPool: VaultSubgraphPoolFragment, chain: Chain) {
    const tokens = vaultSubgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${vaultSubgraphPool.id}-${token.address}`.toLowerCase(),
        poolId: vaultSubgraphPool.id.toLowerCase(),
        chain: chain,
        address: token.address.toLowerCase(),
        index: token.index,
        nestedPoolId: token.nestedPool?.id.toLowerCase() ?? null,
        priceRateProvider: vaultSubgraphPool.rateProviders![i].address.toLowerCase(),
        exemptFromProtocolYieldFee: token.totalProtocolYieldFee === '0' ? true : false,
    }));
}

export function poolTokensDynamicDataTransformer(
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    poolSubgraphPool: PoolSubgraphPoolFragment,
    onchainTokensData: { [address: string]: { balance: bigint; rate: bigint } },
    decimals: { [address: string]: number },
    prices: { [address: string]: number },
    chain: Chain,
): Prisma.PrismaPoolTokenDynamicDataCreateManyInput[] {
    const tokens = vaultSubgraphPool.tokens ?? [];

    return tokens.map((token, i) => {
        const id = `${vaultSubgraphPool.id}-${token.address}`.toLowerCase();
        const onchainTokenData = onchainTokensData[token.address];
        const balance = onchainTokenData?.balance ?? 0n;
        const rate = onchainTokenData?.rate ?? 0n;
        const price = prices[token.address] ?? 0;

        return {
            id,
            poolTokenId: id,
            chain,
            blockNumber: Number(vaultSubgraphPool.blockNumber),
            balance: String(balance),
            balanceUSD: Number(formatUnits(balance, decimals[token.address])) * price,
            priceRate: String(rate),
            weight: poolSubgraphPool.weights[token.index] ?? null,
        };
    });
}

export function poolExpandedTokensTransformer(
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    chain: Chain,
): Prisma.PrismaPoolExpandedTokensCreateManyInput[] {
    const tokens = vaultSubgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        poolId: vaultSubgraphPool.id.toLowerCase(),
        chain: chain,
        tokenAddress: token.address.toLowerCase(),
        nestedPoolId: token.nestedPool?.id.toLowerCase(),
    }));
}
