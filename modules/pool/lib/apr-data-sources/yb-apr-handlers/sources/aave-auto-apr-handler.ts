import { AprHandler } from '..';
import { Chain } from '@prisma/client';
import { getViemClient } from '../../../../../sources/viem-client';
import { parseAbi } from 'viem';
import { env } from '../../../../../../apps/env';
import { prisma } from '../../../../../../prisma/prisma-client';

/** Sets the config data used internally */
const config = {
    ARBITRUM: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/DLuE98kEb5pQNXAcKFQGQgfSQ57Xdou4jnVbAEqMfy3B`,
    },
    AVALANCHE: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/2h9woxy8RTjHu1HJsCEnmzpPHFArU33avmUh4f71JpVn`,
    },
    BASE: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF`,
    },
    GNOSIS: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/HtcDaL8L8iZ2KQNNS44EBVmLruzxuNAz1RkBYdui1QUT`,
    },
    MAINNET: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g`,
    },
    OPTIMISM: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/DSfLz8oQBUeU5atALgUFQKMTSYV9mZAVYp4noLSXAfvb`,
    },
    POLYGON: {
        subgraphURL: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/Co2URyXjnxaw8WqxKyVHdirq9Ahhm5vcTs4dMedAq211`,
    },
};

const query = `query getReserves($underlyingTokens: [Bytes!]) {
    reserves(
      where: {
        underlyingAsset_in: $underlyingTokens
        isActive: true
      }
    ) {
      id
      aToken {
        id
      }
      underlyingAsset
      liquidityRate
    }
  }`;

/** Makes handler callable by chain */
export const chains = Object.keys(config) as Chain[];

export class Handler implements AprHandler {
    async getAprs(chain: Chain) {
        if (!chains.includes(chain)) {
            return {};
        }

        // Get AAVE pools
        const aavePools = await prisma.prismaPool.findMany({
            where: {
                chain,
                OR: [
                    {
                        name: {
                            contains: 'aave',
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        tokens: {
                            some: {
                                token: {
                                    name: {
                                        contains: 'aave',
                                        mode: 'insensitive' as const,
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            include: {
                tokens: {
                    include: {
                        token: true,
                    },
                },
            },
        });

        const wrapperToUnderlying = aavePools
            .map((pool) =>
                pool.tokens
                    .filter(
                        (token) => token.token.name.toLowerCase().match('aave') && token.token.underlyingTokenAddress,
                    )
                    .map((token) => [token.address, token.token.underlyingTokenAddress!]),
            )
            .flat()
            .filter((item, index, self) => self.findIndex((w) => w[0] === item[0]) === index);

        // Get atokens
        const client = getViemClient(chain);
        const contracts = wrapperToUnderlying
            .map(([wrapper]) => wrapper)
            .map((wrapper) => ({
                address: wrapper as `0x${string}`,
                abi: parseAbi(['function aToken() returns (address)']),
                functionName: 'aToken',
            }));
        const aTokens = await client.multicall({ contracts, allowFailure: false });
        const wrappersToATokens = wrapperToUnderlying.map(([wrapper, underlying], index) => [
            wrapper,
            aTokens[index].toLowerCase(),
            underlying,
        ]);

        const requestQuery = {
            operationName: 'getReserves',
            query,
            variables: {
                underlyingTokens: wrapperToUnderlying.map(([_, underlying]) => underlying),
            },
        };

        const response = await fetch(config[chain as keyof typeof config].subgraphURL, {
            method: 'post',
            body: JSON.stringify(requestQuery),
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        const {
            data: { reserves },
        } = data as ReserveResponse;

        // For each reserve, match the wrapper by aToken address
        const aprsByUnderlyingAddress = Object.fromEntries(
            reserves
                .map((r) => [
                    wrappersToATokens.find(([_, aToken]) => aToken === r.aToken.id)?.[0].toLowerCase(),
                    // Converting from aave ray number (27 digits) to float
                    { apr: Number(r.liquidityRate.slice(0, 27)) / 1e27, isIbYield: true },
                ])
                .filter((r) => r[0]),
        );

        return aprsByUnderlyingAddress;
    }
}

interface ReserveResponse {
    data: {
        reserves: [
            {
                underlyingAsset: string;
                liquidityRate: string;
                aToken: {
                    id: string;
                };
            },
        ];
    };
}
