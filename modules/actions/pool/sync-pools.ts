import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3VaultSubgraphClient, V3PoolsSubgraphClient } from '../../sources/subgraphs';
import { tokensTransformer } from '../../sources/transformers/tokens-transformer';
import { poolTransformer, poolTokensTransformer, poolTokensDynamicDataTransformer } from '../../sources/transformers';
import { fetchPoolData } from '../../sources/contracts/fetch-pool-data';
import { ViemClient } from '../../sources/viem-client';
import { formatUnits } from 'viem';

interface CompletePoolDbEntry {
    pool: Prisma.PrismaPoolCreateInput;
    poolDynamicData: Prisma.PrismaPoolDynamicDataUncheckedCreateInput;
    poolToken: Prisma.PrismaPoolTokenCreateManyInput[];
    poolTokenDynamicData: Prisma.PrismaPoolTokenDynamicDataCreateManyInput[];
    poolExpandedTokens: Prisma.PrismaPoolExpandedTokensCreateManyInput[];
}

export const syncPools = async (
    vaultSubgraphClient: V3VaultSubgraphClient,
    poolSubgraphClient: V3PoolsSubgraphClient,
    viemClient: ViemClient,
    vaultAddress: string,
    chain = 'SEPOLIA' as Chain,
    blockNumber: bigint, // TODO: deprecate since we are using always the latest block
) => {
    const vaultSubgraphPools = await vaultSubgraphClient.getAllInitializedPools();
    const { pools: poolsSubgraphPools } = await poolSubgraphClient.Pools();
    const poolsSubgraphPoolsMap = Object.fromEntries(poolsSubgraphPools.map((pool) => [pool.id, pool]));

    // Enrich with onchain data for all the pools
    const onchainData = await fetchPoolData(
        vaultAddress,
        vaultSubgraphPools.map((pool) => pool.id),
        viemClient,
        blockNumber,
    );

    // Store pool tokens and BPT in the tokens table before creating the pools
    const allTokens = tokensTransformer(vaultSubgraphPools, chain);
    try {
        await prisma.prismaToken.createMany({
            data: allTokens,
            skipDuplicates: true,
        });
    } catch (e) {
        console.error('Error creating tokens', e);
    }

    // Get the token prices needed for calculating token balances and total liquidity
    const dbPrices = await prisma.prismaTokenPrice.findMany({
        where: {
            tokenAddress: { in: allTokens.map((token) => token.address) },
            chain: chain,
        },
    });

    // Build helper maps for token prices and decimals
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));
    const prices = Object.fromEntries(dbPrices.map((price) => [price.tokenAddress, price.price]));

    // Get the data for the tables about pools
    const dbPools: CompletePoolDbEntry[] = vaultSubgraphPools.map((vaultSubgraphData) => {
        const onchainPoolData = onchainData[vaultSubgraphData.id];
        const onchainTokensData = Object.fromEntries(onchainPoolData.tokens.map((token) => [token.address, token]));
        const poolSubgraphData = poolsSubgraphPoolsMap[vaultSubgraphData.id];

        return {
            pool: poolTransformer(vaultSubgraphData, poolSubgraphData, chain),
            poolDynamicData: {
                id: vaultSubgraphData.id,
                poolId: vaultSubgraphData.id,
                chain: chain,
                totalShares: vaultSubgraphData.totalShares,
                blockNumber: Number(blockNumber),
                swapFee: String(onchainPoolData.swapFee ?? '0'),
                swapEnabled: true,
                totalLiquidity: 0,
            },
            poolToken: poolTokensTransformer(vaultSubgraphData, chain),
            poolTokenDynamicData: poolTokensDynamicDataTransformer(
                vaultSubgraphData,
                poolSubgraphData,
                onchainTokensData,
                decimals,
                prices,
                chain,
            ),
            poolExpandedTokens: vaultSubgraphData.tokens.map(({ address, nestedPool }) => ({
                tokenAddress: address,
                poolId: vaultSubgraphData.id,
                chain: chain,
                nestedPoolId: nestedPool?.id,
            })),
        };
    });

    // Upsert pools to the database
    for (const { pool, poolToken, poolDynamicData, poolTokenDynamicData, poolExpandedTokens } of dbPools) {
        try {
            await prisma.prismaPool.upsert({
                where: { id_chain: { id: pool.id, chain: pool.chain } },
                create: pool,
                update: pool,
            });

            await prisma.prismaPoolDynamicData.upsert({
                where: { poolId_chain: { poolId: pool.id, chain: pool.chain } },
                create: poolDynamicData,
                update: poolDynamicData,
            });

            // First nullify the pool tokens and then insert them again
            await prisma.prismaPoolToken.deleteMany({ where: { poolId: pool.id } });
            await prisma.prismaPoolTokenDynamicData.deleteMany({ where: { poolTokenId: { startsWith: pool.id } } });
            await prisma.prismaPoolExpandedTokens.deleteMany({ where: { poolId: pool.id } });

            await prisma.prismaPoolToken.createMany({
                data: poolToken,
                skipDuplicates: true,
            });

            await prisma.prismaPoolTokenDynamicData.createMany({
                data: poolTokenDynamicData,
                skipDuplicates: true,
            });

            await prisma.prismaPoolExpandedTokens.createMany({
                data: poolExpandedTokens,
                skipDuplicates: true,
            });
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }
};
