import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { tokenService } from '../../token/token.service';
import { fetchPoolTokenInfo, fetchPoolTokenRates } from '../../sources/contracts';
import { ViemClient } from '../../sources/viem-client';
import { fetchPoolData } from '../../sources/contracts/fetch-pool-data';
import { formatEther, formatUnits, parseUnits } from 'viem';
import { isSameAddress } from '@balancer-labs/sdk';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

const SUPPORTED_POOL_TYPES: PrismaPoolType[] = ['WEIGHTED', 'STABLE'];

export async function updateOnchainDataForAllPools(
    vaultAddress: string,
    viemClient: ViemClient,
    blockNumber: bigint,
    chain = 'SEPOLIA' as Chain,
): Promise<string[]> {
    const allPools = await prisma.prismaPool.findMany({
        where: { chain: chain, vaultVersion: 3 },
        select: {
            id: true,
        },
    });

    return updateOnChainDataForPools(
        vaultAddress,
        '123',
        allPools.map((pool) => pool.id),
        viemClient,
        blockNumber,
        chain,
    );
}

/**
 * Makes sure that all pools are synced in the database
 *
 * @param vaultSubgraphClient
 * @param poolSubgraphClient
 * @param chain
 * @returns syncedPools - the pools that were synced
 */
export async function updateOnChainDataForPools(
    vaultAddress: string,
    balancerQueriesAddress: string,
    poolIds: string[],
    viemClient: ViemClient,
    blockNumber: bigint,
    chain = 'SEPOLIA' as Chain,
): Promise<string[]> {
    if (poolIds.length === 0) {
        return [];
    }
    const updated: string[] = [];

    const filteredPools = await prisma.prismaPool.findMany({
        where: {
            id: { in: poolIds },
            chain: chain,
            type: { in: SUPPORTED_POOL_TYPES },
        },
        include: {
            tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true, token: true } },
            dynamicData: true,
        },
    });

    const filteredPoolIds = filteredPools.map((pool) => pool.id);
    const filteredPoolInputs = filteredPools.map((pool) => ({
        id: pool.id,
        address: pool.address,
        type: pool.type,
        version: pool.version,
    }));

    const tokenPricesForCurrentChain = await tokenService.getTokenPrices(chain);
    const poolTokenData = await fetchPoolTokenInfo(vaultAddress, filteredPoolIds, viemClient, blockNumber);
    const poolTokenRatesData = await fetchPoolTokenRates(vaultAddress, filteredPoolIds, viemClient, blockNumber);
    const poolConfigData = await fetchPoolData(vaultAddress, filteredPoolInputs, viemClient, blockNumber);

    // TODO also need to add tokenPairs for SOR and calc normalized liquidity
    // const tokenPairData = await fetchTokenPairData(
    //     filteredPools,
    //     balancerQueriesAddress,
    //     chain === 'ZKEVM' ? 190 : 1024,
    // );

    const operations = [];
    for (const pool of filteredPools) {
        const poolTokens = poolTokenData[pool.id];
        const poolTokenRates = poolTokenRatesData[pool.id];
        const poolConfig = poolConfigData[pool.id];

        try {
            // if (isStablePool(pool.type)) {
            //     if (!amp) {
            //         console.error(`Stable Pool Missing Amp: ${pool.id}`);
            //         continue;
            //     }

            //     //only update if amp has changed
            //     if ((pool.typeData as StableData).amp !== amp) {
            //         operations.push(
            //             prisma.prismaPool.update({
            //                 where: { id_chain: { id: pool.id, chain: this.options.chain } },
            //                 data: {
            //                     typeData: {
            //                         ...(pool.typeData as StableData),
            //                         amp,
            //                     },
            //                 },
            //             }),
            //         );
            //     }
            // }

            const swapFee = poolConfig.swapFee.toString();
            const totalSupply = formatEther(poolConfig.totalSupply);
            const swapEnabled = !poolConfig.isPoolPaused;
            const isPaused = poolConfig.isPoolPaused;
            const isInRecoveryMode = poolConfig.isPoolInRecoveryMode;

            const yieldProtocolFeePercentage = '0'; // TODO
            const protocolSwapFeePercentage = poolConfig.protocolSwapFeePercentage.toString();

            if (
                pool.dynamicData &&
                (pool.dynamicData.swapFee !== swapFee ||
                    pool.dynamicData.totalShares !== totalSupply ||
                    pool.dynamicData.swapEnabled !== swapEnabled ||
                    pool.dynamicData.protocolYieldFee !== yieldProtocolFeePercentage ||
                    pool.dynamicData.protocolSwapFee !== protocolSwapFeePercentage ||
                    pool.dynamicData.isInRecoveryMode !== isInRecoveryMode ||
                    pool.dynamicData.isPaused !== isPaused)
            ) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: chain } },
                        data: {
                            swapFee,
                            totalShares: totalSupply,
                            totalSharesNum: parseFloat(totalSupply),
                            swapEnabled: typeof swapEnabled !== 'undefined' ? swapEnabled : true,
                            isInRecoveryMode: isInRecoveryMode,
                            isPaused: isPaused,
                            protocolYieldFee: yieldProtocolFeePercentage,
                            protocolSwapFee: protocolSwapFeePercentage,
                            blockNumber: parseFloat(blockNumber.toString()),
                        },
                    }),
                );
            }

            // always update tokenPair data
            // if (pool.dynamicData) {
            //     operations.push(
            //         prisma.prismaPoolDynamicData.update({
            //             where: { id_chain: { id: pool.id, chain: this.options.chain } },
            //             data: {
            //                 tokenPairsData: tokenPairs,
            //             },
            //         }),
            //     );
            // }

            for (let i = 0; i < poolTokens.tokens.length; i++) {
                const tokenAddress = poolTokens.tokens[i];
                const poolToken = pool.tokens.find((token) => isSameAddress(token.address, tokenAddress));

                if (!poolToken) {
                    throw `Pool Missing Expected Token: ${pool.id} ${tokenAddress}`;
                }

                if (poolToken.index !== i) {
                    throw `Pooltoken index mismatch! "poolToken.index": ${poolToken.index} vs "i": ${i} on pool ${pool.id}`;
                }

                const balance = formatUnits(poolTokens.balancesRaw[i], poolToken.token.decimals);

                // set token price rate for various rate types

                // top level token rates, e.g. LSTs in pools
                let priceRate = formatEther(poolTokenRates[i]);

                // // bpt price rate
                // if (onchainData.rate && isSameAddress(poolToken.address, pool.address)) {
                //     priceRate = onchainData.rate;
                // }

                // TODO v3 does not contain the BPT as pool token, do we need to add it nevertheless?

                if (
                    !poolToken.dynamicData ||
                    poolToken.dynamicData.balance !== balance ||
                    poolToken.dynamicData.priceRate !== priceRate
                ) {
                    operations.push(
                        prisma.prismaPoolTokenDynamicData.update({
                            where: { id_chain: { id: poolToken.id, chain: chain } },
                            data: {
                                blockNumber: parseFloat(blockNumber.toString()),
                                priceRate,
                                balance,
                                balanceUSD:
                                    poolToken.address === pool.address
                                        ? 0
                                        : tokenService.getPriceForToken(tokenPricesForCurrentChain, poolToken.address) *
                                          parseFloat(balance),
                            },
                        }),
                    );
                }
            }
        } catch (e) {
            console.log('error syncing on chain data', e);
        }
    }
    await prismaBulkExecuteOperations(operations, false);

    return updated;
}
