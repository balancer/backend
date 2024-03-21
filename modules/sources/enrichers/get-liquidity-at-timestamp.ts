import { BlockNumbersClient, V3VaultSubgraphClient } from '../subgraphs';
import { V2VaultSubgraphClient } from '../../subgraphs/balancer-subgraph';
import { prisma } from '../../../prisma/prisma-client';
import { daysAgo, roundToHour, roundToMidnight } from '../../common/time';
import { fn } from '../../common/numbers';
import { DAYS_OF_HOURLY_PRICES } from '../../../config';

export const getLiquidityAtTimestamp = async (
    ids: string[],
    vaultClient: V2VaultSubgraphClient | V3VaultSubgraphClient,
    blockNumbersClient: BlockNumbersClient,
    timestamp = daysAgo(1), // 24 hours ago
) => {
    const blockNumber = await blockNumbersClient.fetchBlockByTime(timestamp);

    const { pools } = await vaultClient.PoolBalances({
        where: { id_in: ids },
        block: { number: Number(blockNumber) },
    });

    // Guard against empty pools, for example when the pools weren't created yet
    if (!pools.length) {
        return null;
    }

    const tokenAddresses = pools
        .map(({ tokens }) => tokens?.map(({ address }) => address))
        .flat()
        .filter((address): address is string => !!address);

    // Guard against empty tokenAddresses
    if (!tokenAddresses.length) {
        return null;
    }

    const roundedTimestamp =
        timestamp > daysAgo(DAYS_OF_HOURLY_PRICES) ? roundToHour(timestamp) : roundToMidnight(timestamp);

    const prices = await prisma.prismaTokenPrice.findMany({
        where: {
            tokenAddress: {
                in: tokenAddresses,
            },
            timestamp: roundedTimestamp,
        },
    });

    const tvls = pools.map(({ id, address, tokens }) => {
        const tvl = tokens
            ?.filter((token) => token.address !== address) // Filter out the pool token
            .reduce((acc, token) => {
                const price = prices.find((p) => p.tokenAddress === token.address);
                if (!price) return acc;

                return acc + fn(token.balance, token.decimals) * price.price * parseFloat(token.priceRate);
            }, 0);

        return [id, tvl] as const;
    });

    return Object.fromEntries(tvls);
};
