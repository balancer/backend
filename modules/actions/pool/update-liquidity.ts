import { Chain } from '@prisma/client';
import { daysAgo, hoursAgo, roundToHour, roundToMidnight } from '../../common/time';
import { prisma } from '../../../prisma/prisma-client';
import { isSupportedInt } from '../../../prisma/prisma-util';
import * as Sentry from '@sentry/node';
import { getPriceForToken } from '../../helper/get-price-for-token';
import { multicallViem } from '../../web3/multicaller-viem';
import { ViemClient } from '../../sources/viem-client';
import config from '../../../config';
import { blockNumbers } from '../../block-numbers';
import { Abi, erc20Abi, formatUnits } from 'viem';
import { DAYS_OF_HOURLY_PRICES } from '../../../config';
import _ from 'lodash';
import vaultV2 from '../../pool/abi/Vault.json';
import vaultV3 from '../../sources/contracts/abis/VaultV3';

// V2 Vault ABI - only the functions we need
const v2VaultAbi = vaultV2.filter((item) => item.type === 'function' && item.name === 'getPoolTokens');

// V3 Vault ABI - only the functions we need
const v3VaultAbi = vaultV3.filter((item) => item.type === 'function' && item.name === 'getPoolTokenInfo');

/**
 * Updates the total liquidity 24h ago for the given pools by fetching balances directly from vault contracts
 * Comment: is this really necessary to have in the pools? We have snapshots
 *
 * @param ids Pool IDs to update
 * @param chain Chain to operate on
 * @returns Updated pool IDs
 */
export const updateLiquidity24hAgo = async (ids: string[], chain: Chain, client: ViemClient) => {
    if (ids.length === 0) return [];

    // Get timestamp and block number
    const ts = chain === Chain.SEPOLIA ? hoursAgo(1) : daysAgo(1);
    const blockNumber = await blockNumbers().getBlock(chain, ts);

    if (!blockNumber) {
        console.log('No block found for timestamp', ts, chain);
        return [];
    }

    // Get vault addresses
    const v2VaultAddress = config[chain].balancer.v2.vaultAddress as `0x${string}`;
    const v3VaultAddress = config[chain].balancer.v3.vaultAddress as `0x${string}`;

    // Prepare multicall calls
    const calls = ids.flatMap((id) => [
        id.length === 42
            ? {
                  path: `${id}.poolTokens`,
                  address: v3VaultAddress,
                  abi: v3VaultAbi,
                  functionName: 'getPoolTokenInfo',
                  args: [id],
                  parser: (info: any) =>
                      new Map(info[0].map((token: string, idx: number) => [token.toLowerCase(), info[2][idx]])),
              }
            : {
                  path: `${id}.poolTokens`,
                  address: v2VaultAddress,
                  abi: v2VaultAbi as Abi,
                  functionName: 'getPoolTokens',
                  args: [id],
                  parser: (info: any) =>
                      new Map(info[0].map((token: string, idx: number) => [token.toLowerCase(), info[1][idx]])),
              },
        {
            path: `${id}.totalSupply`,
            address: id.substring(0, 42) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'totalSupply',
            parser: (totalSupply: bigint) => formatUnits(totalSupply, 18),
        },
    ]);

    if (calls.length === 0) return [];

    // Execute multicall at historical block
    const results = await multicallViem<{ [pool: string]: { poolTokens: Map<string, bigint>; totalSupply: string } }>(
        client,
        calls,
        BigInt(blockNumber),
    );

    // Get token addresses for price lookup
    const tokenAddresses = new Set<string>(Object.values(results).flatMap((result) => [...result.poolTokens.keys()]));

    // Get token prices at the timestamp
    const roundedTimestamp = ts > daysAgo(DAYS_OF_HOURLY_PRICES) ? roundToHour(ts) : roundToMidnight(ts);
    const prices = await prisma.prismaTokenPrice.findMany({
        where: {
            tokenAddress: { in: Array.from(tokenAddresses) },
            timestamp: roundedTimestamp,
            chain,
        },
    });
    const decimalsMap = await prisma.prismaToken
        .findMany({
            select: {
                address: true,
                decimals: true,
            },
            where: { chain },
        })
        .then((results) => new Map(results.map((r) => [r.address, r.decimals])));

    // Calculate TVL and total shares for each pool
    const data: Record<string, { tvl: number; totalShares: string }> = {};

    for (const [poolId, poolInfo] of Object.entries(results)) {
        const tokens = [...poolInfo.poolTokens.keys()];
        const balances = [...poolInfo.poolTokens.values()];
        const totalSupply = poolInfo.totalSupply;

        const bptTokenIndex = tokens.findIndex(
            (token) => token.toLowerCase() === poolId.substring(0, 42).toLowerCase(),
        );

        // Calculate TVL
        const tvl = tokens.reduce((tvl, address, idx) => {
            if (idx === bptTokenIndex) return tvl;

            const price = prices.find((p) => p.tokenAddress.toLowerCase() === address);

            if (!price) {
                console.error(`Price not found for ${address} in TVL 24h ago calculation`);
                return tvl;
            }

            const decimals = decimalsMap.get(address);

            if (!decimals) {
                console.error(`Decimals not found for ${address} in TVL 24h ago calculation`);
                return tvl;
            }

            const balance = formatUnits(balances[idx], decimals);

            return tvl + parseFloat(balance) * price.price;
        }, 0);

        data[poolId] = { tvl, totalShares: totalSupply };
    }

    // Update liquidity data
    const updates = Object.entries(data)
        .map(([id, { tvl, totalShares }]) => {
            if (tvl && tvl < 0) {
                console.error('Negative Tvl24h ago', id, chain, tvl);
                return;
            }

            return {
                where: {
                    poolId_chain: {
                        poolId: id,
                        chain,
                    },
                },
                data: {
                    totalLiquidity24hAgo: tvl,
                    totalShares24hAgo: totalShares,
                },
            };
        })
        .filter((item) => !!item);

    const updated: string[] = [];
    for (const update of updates) {
        try {
            await prisma.prismaPoolDynamicData.update(update);
            updated.push(update.where.poolId_chain.poolId);
        } catch (e) {
            // TODO: Some V2 pools are missing dynamic data on creation. Should be fixed when creating new pool records.
            // https://github.com/balancer/backend/issues/288
            console.error(
                `Error updating liquidity 24h ago for pool ${update.where.poolId_chain.poolId} ${update.where.poolId_chain.chain} with error: ${e}`,
            );
        }
    }

    return updated;
};

/**
 * Liquidity is dependent on token prices, so the values here are constantly in flux.
 * When updating, the easiest is to update all pools at once.
 */
export const updateLiquidityValuesForPools = async (chain: Chain, poolIds?: string[]) => {
    const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            chain,
        },
    });

    const pdts = await prisma.prismaPoolDynamicData.findMany({
        include: { pool: { include: { tokens: true } } },
        where: poolIds ? { poolId: { in: poolIds }, chain } : { chain },
    });

    let updates: any[] = [];

    for (const pdt of pdts) {
        const pool = pdt.pool;
        const balanceUSDs = pool.tokens.map((token) => ({
            id: token.id,
            previousBalanceUSD: token.balanceUSD,
            balanceUSD:
                token.address === pool.address
                    ? 0
                    : parseFloat(token.balance || '0') * getPriceForToken(tokenPrices, token.address, chain),
        }));
        const totalLiquidity = _.sumBy(balanceUSDs, (item) => item.balanceUSD);

        for (const item of balanceUSDs) {
            if (!isSupportedInt(item.balanceUSD)) {
                Sentry.captureException(
                    `Skipping unsupported int size for prismaPoolToken.balanceUSD: ${item.balanceUSD}`,
                    {
                        tags: {
                            tokenId: item.id,
                            poolId: pool.id,
                            poolName: pool.name,
                            chain: pool.chain,
                        },
                    },
                );
                continue;
            }

            if (Math.abs(item.balanceUSD - item.previousBalanceUSD) > 1) {
                updates.push(
                    prisma.prismaPoolToken.update({
                        where: { id_chain: { id: item.id, chain: pool.chain } },
                        data: { balanceUSD: item.balanceUSD },
                    }),
                );
            }
        }
        if (!isSupportedInt(totalLiquidity)) {
            Sentry.captureException(
                `Skipping unsupported int size for prismaPoolDynamicData.totalLiquidity: ${totalLiquidity} `,
                {
                    tags: {
                        poolId: pool.id,
                        poolName: pool.name,
                        chain: pool.chain,
                    },
                },
            );
            continue;
        }

        if (Math.abs(totalLiquidity - pdt.totalLiquidity) > 1) {
            updates.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    data: { totalLiquidity },
                }),
            );
        }

        if (updates.length > 100) {
            await Promise.all(updates);
            updates = [];
        }
    }

    await Promise.all(updates);
};
