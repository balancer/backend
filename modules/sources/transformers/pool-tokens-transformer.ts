import { Chain, Prisma } from '@prisma/client';
import { formatUnits } from 'viem';
import { JoinedSubgraphPool } from '../subgraphs';

// Comment: removing return type, because prisma doesn't export 'PrismaPoolTokenCreateManyPoolInput' type
export function poolTokensTransformer(poolData: JoinedSubgraphPool, chain: Chain) {
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

export function poolTokensDynamicDataTransformer(
    poolData: JoinedSubgraphPool,
    onchainTokensData: { [address: string]: { balance: bigint; rate: bigint; scalingFactor?: bigint } },
    chain: Chain,
) {
    const tokens = poolData.tokens ?? [];

    return tokens.map((token, i) => {
        const id = `${poolData.id}-${token.address}`.toLowerCase();
        const subgraphToken = poolData.tokens.find((t) => t.address === token.address);
        const onchainTokenData = onchainTokensData[token.address];
        const balance = onchainTokenData?.balance ?? 0n;
        const rate = onchainTokenData?.rate ?? 1000000000000000000n;
        const scalingFactor = onchainTokenData?.scalingFactor ?? undefined;

        if (!subgraphToken) throw new Error(`Token ${token.address} not found in subgraph data`);

        return {
            id,
            poolTokenId: id,
            chain,
            blockNumber: Number(poolData.blockNumber),
            balance: formatUnits(balance, subgraphToken.decimals),
            priceRate: String(rate),
            // scalingFactor: scalingFactor ? String(scalingFactor) : null,
            weight: poolData.weights ? poolData.weights[token.index] ?? null : null,
        };
    });
}

export function poolExpandedTokensTransformer(
    poolData: JoinedSubgraphPool,
    chain: Chain,
): Prisma.PrismaPoolExpandedTokensCreateManyInput[] {
    const tokens = poolData.tokens ?? [];
    return tokens.map((token, i) => ({
        poolId: poolData.id.toLowerCase(),
        chain: chain,
        tokenAddress: token.address.toLowerCase(),
        nestedPoolId: token.nestedPool?.id.toLowerCase(),
    }));
}
