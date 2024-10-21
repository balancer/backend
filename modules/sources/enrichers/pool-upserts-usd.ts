import _ from 'lodash';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { PoolDynamicUpsertData } from '../transformers/onchain-pool-update';
import { PoolUpsertData } from '../../../prisma/prisma-types';

export const enrichPoolUpsertsUsd = (data: PoolUpsertData, prices: { [address: string]: number }): PoolUpsertData => {
    const poolTokenDynamicData = data.poolTokenDynamicData.map((token) => ({
        ...token,
        balanceUSD: parseFloat(token.balance) * prices[token.id.split('-')[1]] || 0,
    }));

    const poolDynamicData = {
        ...data.poolDynamicData,
        totalLiquidity: poolTokenDynamicData.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
    };

    return {
        ...data,
        poolDynamicData,
        poolTokenDynamicData,
    };
};

/**
 * Takes pool data for the DB upserts and enriches them with USD values:
 *  - pool tokens balances in USD
 *  - pool liquidity in USD
 *
 * @param upsertData
 * @param chain
 * @returns
 */
export async function poolUpsertsUsd(
    upsertData: PoolUpsertData[],
    chain: Chain,
    allTokens: { address: string; decimals: number }[],
): Promise<PoolUpsertData[]> {
    // Get the token prices needed for calculating token balances and total liquidity
    const dbPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            tokenAddress: { in: allTokens.map((token) => token.address) },
            chain: chain,
        },
    });
    const prices = Object.fromEntries(dbPrices.map((price) => [price.tokenAddress, price.price]));

    return upsertData.map((pool) => {
        const poolTokenDynamicData = pool!.poolTokenDynamicData.map((token) => ({
            ...token,
            balanceUSD: parseFloat(token.balance) * prices[token.id.split('-')[1]] || 0,
        }));

        const poolDynamicData = {
            ...pool.poolDynamicData,
            // TODO: do we need to filter out BPTs?
            totalLiquidity: poolTokenDynamicData.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
        };

        return {
            ...pool,
            poolDynamicData,
            poolTokenDynamicData,
        };
    });
}

/**
 * Takes pool data for the DB upserts and enriches them with USD values:
 *  - pool tokens balances in USD
 *  - pool liquidity in USD
 *
 * @param upsertData
 * @param chain
 * @returns
 */
export async function poolDynamicDataUpsertsUsd(
    upsertData: PoolDynamicUpsertData[],
    chain: Chain,
    allTokens: { address: string; decimals: number }[],
): Promise<PoolDynamicUpsertData[]> {
    // Get the token prices needed for calculating token balances and total liquidity
    const dbPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            tokenAddress: { in: allTokens.map((token) => token.address) },
            chain: chain,
        },
    });
    const prices = Object.fromEntries(dbPrices.map((price) => [price.tokenAddress, price.price]));

    return upsertData.map((pool) => {
        const poolTokenDynamicData = pool!.poolTokenDynamicData.map((token) => ({
            ...token,
            balanceUSD: parseFloat(token.balance) * prices[token.id.split('-')[1]] || 0,
        }));

        const poolDynamicData = {
            ...pool.poolDynamicData,
            // TODO: do we need to filter out BPTs?
            totalLiquidity: poolTokenDynamicData.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
        };

        return {
            ...pool,
            poolDynamicData,
            poolTokenDynamicData,
        };
    });
}
