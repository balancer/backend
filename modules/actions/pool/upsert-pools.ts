import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { tokensTransformer } from '../../sources/transformers/tokens-transformer';
import { poolTransformer, poolTokensTransformer, poolTokensDynamicDataTransformer } from '../../sources/transformers';
import { fetchPoolData } from '../../sources/contracts/fetch-pool-data';
import { ViemClient } from '../../sources/viem-client';
import { JoinedSubgraphPool } from '../../sources/subgraphs';
import { formatUnits } from 'viem';

interface CompletePoolDbEntry {
    pool: Prisma.PrismaPoolCreateInput;
    poolDynamicData: Prisma.PrismaPoolDynamicDataUncheckedCreateInput;
    poolToken: Prisma.PrismaPoolTokenCreateManyInput[];
    poolTokenDynamicData: Prisma.PrismaPoolTokenDynamicDataCreateManyInput[];
    poolExpandedTokens: Prisma.PrismaPoolExpandedTokensCreateManyInput[];
}

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, poolTokenDynamicData, expandedToken tables
 *
 * @param subgraphPools
 * @param viemClient
 * @param vaultAddress
 * @param chain
 * @param blockNumber
 */
export const upsertPools = async (
    subgraphPools: JoinedSubgraphPool[],
    viemClient: ViemClient,
    vaultAddress: string,
    chain = 'SEPOLIA' as Chain,
    blockNumber: bigint, // TODO: deprecate since we are using always the latest block
) => {
    // Enrich with onchain data for all the pools
    const onchainData = await fetchPoolData(
        vaultAddress,
        subgraphPools.map((pool) => pool.id),
        viemClient,
        blockNumber,
    );

    // Store pool tokens and BPT in the tokens table before creating the pools
    const allTokens = tokensTransformer(subgraphPools, chain);
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
    const dbPools: CompletePoolDbEntry[] = subgraphPools.map((poolData) => {
        const onchainPoolData = onchainData[poolData.id];
        const onchainTokensData = Object.fromEntries(onchainPoolData.tokens.map((token) => [token.address, token]));

        return {
            pool: poolTransformer(poolData, chain),
            poolDynamicData: {
                id: poolData.id,
                poolId: poolData.id,
                chain: chain,
                totalShares: String(onchainPoolData.totalSupply),
                totalSharesNum: Number(formatUnits(onchainPoolData.totalSupply, 18)),
                blockNumber: Number(blockNumber),
                swapFee: String(onchainPoolData.swapFee ?? '0'),
                swapEnabled: true,
                totalLiquidity: 0,
            },
            poolToken: poolTokensTransformer(poolData, chain),
            poolTokenDynamicData: poolTokensDynamicDataTransformer(
                poolData,
                onchainTokensData,
                decimals,
                prices,
                chain,
            ),
            poolExpandedTokens: poolData.tokens.map(({ address, nestedPool }) => ({
                tokenAddress: address,
                poolId: poolData.id,
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
