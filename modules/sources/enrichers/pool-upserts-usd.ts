import _ from 'lodash';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { SubgraphPoolUpsertData } from '../transformers/subgraph-pool-upsert';
import { formatUnits } from 'viem';
import { OnchainPoolUpdateData } from '../transformers/onchain-pool-update';

type EnrichedTokenData<T> = T extends { poolTokenDynamicData: infer U }
    ? U extends any[]
        ? {
              poolDynamicData: U[number] & { totalLiquidity: number };
              poolTokenDynamicData: (U[number] & { balanceUSD: number })[];
          }
        : never
    : never;

/**
 * Takes pool data for the DB upserts and enriches them with USD values:
 *  - pool tokens balances in USD
 *  - pool liquidity in USD
 *
 * @param upsertData
 * @param chain
 * @returns
 */
export async function poolUpsertsUsd<T extends OnchainPoolUpdateData | SubgraphPoolUpsertData>(
    upsertData: T[],
    chain: Chain,
    allTokens: { address: string; decimals: number }[],
): Promise<(T & EnrichedTokenData<T>)[]> {
    // Get the token prices needed for calculating token balances and total liquidity
    const dbPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            tokenAddress: { in: allTokens.map((token) => token.address) },
            chain: chain,
        },
    });
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));
    const prices = Object.fromEntries(dbPrices.map((price) => [price.tokenAddress, price.price]));

    return upsertData.map((pool) => {
        const poolTokenDynamicData = pool.poolTokenDynamicData.map((token) => ({
            ...token,
            balanceUSD:
                parseFloat(formatUnits(BigInt(token.balance), decimals[token.id.split('-')[1]])) *
                    prices[token.id.split('-')[1]] || 0,
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
    }) as (T & EnrichedTokenData<T>)[];
}
