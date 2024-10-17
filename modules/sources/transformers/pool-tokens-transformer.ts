import { Chain, Prisma } from '@prisma/client';
import { formatUnits } from 'viem';
import { V3JoinedSubgraphPool } from '../subgraphs';
import { CowAmmPoolFragment } from '../subgraphs/cow-amm/generated/types';

export function poolV3TokensTransformer(
    poolData: V3JoinedSubgraphPool,
    chain: Chain,
): Prisma.PrismaPoolTokenCreateManyInput[] {
    const tokens = poolData.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${poolData.id}-${token.address}`.toLowerCase(),
        poolId: poolData.id.toLowerCase(),
        chain: chain,
        address: token.address.toLowerCase(),
        index: token.index,
        nestedPoolId: token.nestedPool?.id.toLowerCase() ?? null,
        priceRateProvider: poolData.rateProviders![i].address.toLowerCase(),
        exemptFromProtocolYieldFee: !token.paysYieldFees,
    }));
}

export function poolCowTokensTransformer(
    poolData: CowAmmPoolFragment,
    chain: Chain,
): Prisma.PrismaPoolTokenCreateManyInput[] {
    const tokens = poolData.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${poolData.id}-${token.address}`.toLowerCase(),
        poolId: poolData.id.toLowerCase(),
        chain: chain,
        address: token.address.toLowerCase(),
        index: token.index,
        nestedPoolId: null,
        priceRateProvider: undefined,
        exemptFromProtocolYieldFee: false,
    }));
}

export function poolTokensDynamicDataTransformer(
    poolData: V3JoinedSubgraphPool | CowAmmPoolFragment,
    onchainTokensData: { [address: string]: { balance: bigint; rate: bigint; scalingFactor?: bigint } },
    chain: Chain,
): Prisma.PrismaPoolTokenDynamicDataCreateManyInput[] {
    const tokens = poolData.tokens ?? [];

    return tokens.map((token, i) => {
        const id = `${poolData.id}-${token.address}`.toLowerCase();
        const subgraphToken = poolData.tokens.find((t) => t.address === token.address);
        const onchainTokenData = onchainTokensData[token.address];
        const balance = onchainTokenData?.balance ?? 0n;
        const rate = onchainTokenData?.rate ?? 1000000000000000000n;

        if (!subgraphToken) throw new Error(`Token ${token.address} not found in subgraph data`);

        return {
            id,
            poolTokenId: id,
            chain,
            blockNumber: Number(poolData.blockNumber),
            balance: formatUnits(balance, subgraphToken.decimals),
            balanceUSD: 0, //added later
            priceRate: String(rate),
            weight: poolData.weights ? poolData.weights[token.index] ?? null : null,
        };
    });
}

export function poolExpandedTokensTransformer(
    poolId: string,
    tokens: { address: string; nestedPool?: { id: string } }[],
    chain: Chain,
): Prisma.PrismaPoolExpandedTokensCreateManyInput[] {
    return tokens.map((token, i) => ({
        poolId: poolId,
        chain: chain,
        tokenAddress: token.address.toLowerCase(),
        nestedPoolId: token.nestedPool?.id.toLowerCase(),
    }));
}
