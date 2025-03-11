import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { tokensTransformer } from '../../../sources/transformers/tokens-transformer';
import { V3JoinedSubgraphPool } from '../../../sources/subgraphs';
import { enrichPoolUpsertsUsd } from '../../../sources/enrichers/pool-upserts-usd';
import { PoolsClient, type VaultClient } from '../../../sources/contracts';
import { poolUpsertTransformerV3 } from '../../../sources/transformers/pool-upsert-transformer-v3';
import { applyOnchainDataUpdateV3 } from '../../../sources/enrichers/apply-onchain-data';
import { fetchErc4626AndUnderlyingTokenData } from '../../../sources/contracts/fetch-erc4626-token-data';
import { getViemClient } from '../../../sources/viem-client';

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, expandedToken tables
 *
 * @param subgraphPools
 * @param vaultClient
 * @param chain
 * @param blockNumber
 */
export const upsertPools = async (
    subgraphPools: V3JoinedSubgraphPool[],
    vaultClient: VaultClient,
    poolsClient: PoolsClient,
    chain: Chain,
    blockNumber: number,
) => {
    // Transform pools first
    let pools = subgraphPools.map((fragment) => poolUpsertTransformerV3(fragment, chain, blockNumber));
    const poolIds = pools.map((pool) => pool.pool.id);

    // Fetch all necessary data in parallel
    const [onchainData, poolTypeData, allTokens] = await Promise.all([
        vaultClient.fetchPoolData(poolIds, BigInt(blockNumber)),
        poolsClient.fetchPoolTypeData(
            pools.map((pool) => ({
                id: pool.pool.id,
                type: pool.pool.type,
            })),
            BigInt(blockNumber),
        ),
        tokensTransformer(subgraphPools, chain),
    ]);

    // Process token data and fetch prices in parallel
    const [enrichedTokensWithErc4626Data, prices] = await Promise.all([
        fetchErc4626AndUnderlyingTokenData(allTokens, getViemClient(chain)),
        prisma.prismaTokenCurrentPrice
            .findMany({
                where: {
                    chain: chain,
                    tokenAddress: { in: allTokens.map((token) => token.address) },
                },
            })
            .then((priceData) => Object.fromEntries(priceData.map((price) => [price.tokenAddress, price.price]))),
    ]);

    // Update ERC4626 token data
    const erc4626Promises = enrichedTokensWithErc4626Data.map(async (token) => {
        const tokenUpsert = prisma.prismaToken.upsert({
            where: {
                address_chain: {
                    address: token.address,
                    chain: chain,
                },
            },
            create: {
                ...token,
                chain,
            },
            update: {
                ...token,
            },
        });

        const typeUpsert = token.underlyingTokenAddress
            ? prisma.prismaTokenType.upsert({
                  where: {
                      id_chain: {
                          id: `${token.address}-erc4626`,
                          chain,
                      },
                  },
                  create: {
                      id: `${token.address}-erc4626`,
                      chain,
                      tokenAddress: token.address,
                      type: 'ERC4626',
                  },
                  update: {
                      id: `${token.address}-erc4626`,
                      chain,
                      tokenAddress: token.address,
                      type: 'ERC4626',
                  },
              })
            : Promise.resolve();

        return Promise.all([tokenUpsert, typeUpsert]);
    });

    await Promise.all(erc4626Promises);

    // Apply onchain data, type data, and USD enrichment in one pass
    pools = pools.map((upsert) => {
        // Apply onchain data
        const withOnchainData = applyOnchainDataUpdateV3(
            upsert,
            onchainData[upsert.pool.id],
            upsert.tokens,
            chain,
            upsert.pool.id,
            blockNumber,
        );

        // Apply type data
        const typeData = poolTypeData.find((data) => data.id === upsert.pool.id)?.typeData || {};
        const withTypeData = {
            ...upsert,
            pool: {
                ...upsert.pool,
                typeData: {
                    ...(upsert.pool.typeData ? (upsert.pool.typeData as any) : {}),
                    ...typeData,
                },
            },
            poolToken: withOnchainData.poolToken,
            poolDynamicData: withOnchainData.poolDynamicData,
        };

        // Apply USD enrichment
        const withUsdData = enrichPoolUpsertsUsd(
            {
                poolDynamicData: withTypeData.poolDynamicData,
                poolToken: withTypeData.poolToken,
            },
            prices,
        );

        return {
            ...withTypeData,
            poolDynamicData: withUsdData.poolDynamicData,
            poolToken: withUsdData.poolToken,
        };
    });

    // Upsert pools to the database in batches
    for (const { pool, poolToken, poolDynamicData, poolExpandedTokens } of pools) {
        try {
            await prisma.$transaction([
                prisma.prismaPool.upsert({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    create: pool,
                    update: pool,
                }),
                prisma.prismaPoolDynamicData.upsert({
                    where: { poolId_chain: { poolId: pool.id, chain: pool.chain } },
                    create: poolDynamicData,
                    update: poolDynamicData,
                }),
                prisma.prismaPoolToken.deleteMany({
                    where: { poolId: pool.id, address: { notIn: poolToken.map((t) => t.address) } },
                }),
                prisma.prismaPoolExpandedTokens.deleteMany({
                    where: { poolId: pool.id, tokenAddress: { notIn: poolToken.map((t) => t.address) } },
                }),
                ...poolToken.map((token) =>
                    prisma.prismaPoolToken.upsert({
                        where: { id_chain: { id: token.id, chain } },
                        create: token,
                        update: token,
                    }),
                ),
                ...poolExpandedTokens.map((token) =>
                    prisma.prismaPoolExpandedTokens.upsert({
                        where: {
                            tokenAddress_poolId_chain: {
                                tokenAddress: token.tokenAddress,
                                poolId: pool.id,
                                chain,
                            },
                        },
                        create: token,
                        update: token,
                    }),
                ),
            ]);
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return poolIds;
};
