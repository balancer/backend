import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchPoolData } from '../../sources/contracts/fetch-pool-data';
import { ViemClient } from '../../sources/viem-client';

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
export const syncPools = async (
    ids: string[],
    viemClient: ViemClient,
    vaultAddress: string,
    chain = 'SEPOLIA' as Chain,
    blockNumber: bigint, // TODO: deprecate since we are using always the latest block
) => {
    // Enrich with onchain data for all the pools
    const onchainData = await fetchPoolData(vaultAddress, ids, viemClient, blockNumber);

    // Get the data for the tables about pools
    const dbUpdates = Object.keys(onchainData).map((id) => {
        const onchainPoolData = onchainData[id];

        return {
            poolDynamicData: {
                where: { poolId_chain: { poolId: id.toLowerCase(), chain } },
                data: {
                    isPaused: onchainPoolData.isPoolPaused,
                    isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
                    totalShares: String(onchainPoolData.totalSupply),
                    blockNumber: Number(blockNumber),
                    swapFee: String(onchainPoolData.swapFee ?? '0'),
                },
            },
            poolTokenDynamicData: onchainPoolData.tokens.map((tokenData) => ({
                where: {
                    id_chain: {
                        id: `${id}-${tokenData.address.toLowerCase()}`,
                        chain,
                    },
                },
                data: {
                    balance: String(tokenData.balance),
                    priceRate: String(tokenData.rate),
                    blockNumber: Number(blockNumber),
                },
            })),
        };
    });

    /** TODO: enrich updates with USD values
    const tokenAddresses = Array.from(
        new Set(Object.values(onchainData).flatMap((pool) => pool.tokens.map((token) => token.address))),
    );

    // Get the token prices needed for calculating token balances and total liquidity
    const dbPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            tokenAddress: { in: tokenAddresses },
            chain: chain,
        },
        include: {
            token: true,
        },
    });

    // Build helper maps for token prices and decimals
    const decimals = Object.fromEntries(dbPrices.map(({ token }) => [token.address, token.decimals]));
    const prices = Object.fromEntries(dbPrices.map((price) => [price.tokenAddress, price.price]));
    */

    // Update pools data to the database
    for (const { poolDynamicData, poolTokenDynamicData } of dbUpdates) {
        try {
            await prisma.prismaPoolDynamicData.update(poolDynamicData);

            for (const tokenUpdate of poolTokenDynamicData) {
                await prisma.prismaPoolTokenDynamicData.update(tokenUpdate);
            }
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return ids;
};
