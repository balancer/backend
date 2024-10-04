import { prisma } from '../../prisma/prisma-client';
import { Chain } from '@prisma/client';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import { chainToIdMap } from '../network/network-config';

/**
 * 'Latest FX Price' is relevant only to FX pools. It is sourced from offchain platforms, like Chainlink.
 * The subgraph actively indexes this price by listening to the 'Answer Updated' events emitted by Chainlink oracles.
 * For reference and more details, see the code at:
 * https://github.com/balancer/balancer-subgraph-v2/blob/master/src/mappings/pricing.ts#L373
 *
 * Note: 'LatestFXPrice' is a dependency of SORv2.
 */
export const syncLatestFXPrices = async (subgraphUrls: string[], chain: Chain) => {
    const { pools } = await fetchFxPools(subgraphUrls, chain);

    for (const pool of pools) {
        const { tokens } = pool;
        if (!tokens) continue;

        for (const token of tokens) {
            try {
                await prisma.prismaPoolTokenDynamicData.update({
                    where: {
                        id_chain: {
                            id: token.id,
                            chain,
                        },
                    },
                    data: {
                        latestFxPrice: token.token.latestFXPrice ? parseFloat(token.token.latestFXPrice) : undefined,
                    },
                });
            } catch (e) {
                console.error(`Error updating latest FX price for token ${token.id} on chain ${chain}: ${e}`);
            }
        }
    }

    return true;
};

const fetchFxPools = (subgraphUrls: string[], chain: Chain) => {
    const sdk = getV2SubgraphClient(subgraphUrls, chain);

    return sdk.BalancerPools({
        where: { poolType: 'FX' },
    });
};
