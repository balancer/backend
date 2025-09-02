import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { YbAprHandler } from '../../types';
import { getViemClient } from '../../../sources/viem-client';
import { parseAbi } from 'viem';

const query = `query getReserves($underlyingAssets: [Bytes!]) {
    reserves(
      where: {
        underlyingAsset_in: $underlyingAssets
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

export const aaveAprHandler: YbAprHandler = async ({
    subgraphUrl,
    tokens,
    chain,
}: {
    subgraphUrl: string;
    chain: Chain;
    tokens: {
        [underlyingAssetName: string]: {
            underlyingAssetAddress: string;
            aTokenAddress: string;
            wrappedTokens: {
                [wrappedTokenName: string]: string;
            };
            isIbYield?: boolean;
        };
    };
}) => {
    try {
        const dbTokenMap = await getDbTokenMappings(chain);

        const underlyingAssets = [
            ...new Set([
                ...Object.values(tokens).map(({ underlyingAssetAddress }) => underlyingAssetAddress),
                ...dbTokenMap.map((t) => t.underlyingAssetAddress),
            ]),
        ];

        const requestQuery = {
            operationName: 'getReserves',
            query,
            variables: { underlyingAssets },
        };

        const response = await fetch(subgraphUrl, {
            method: 'POST',
            body: JSON.stringify(requestQuery),
            headers: { 'Content-Type': 'application/json' },
        }).then((response) => response.json() as Promise<ReserveResponse>);

        const {
            data: { reserves },
        } = response;

        // For each reserve, match the wrapper by aToken address
        const aprsByUnderlyingAddress = Object.fromEntries(
            reserves.map((r) => [
                `${r.underlyingAsset}-${r.aToken.id}`,
                // Converting from aave ray number (27 digits) to float
                Number(r.liquidityRate.slice(0, 27)) / 1e27,
            ]),
        );
        const aprEntries = [...Object.values(tokens), ...dbTokenMap]
            .map(({ wrappedTokens, aTokenAddress, underlyingAssetAddress }) => {
                const apr = aprsByUnderlyingAddress[`${underlyingAssetAddress}-${aTokenAddress}`];
                if (apr === undefined) {
                    // skipping tokens that are from a different market (db entries might not overlap with subgraph entries)
                    return;
                }
                return Object.values(wrappedTokens).map((wrappedTokenAddress) => ({
                    address: wrappedTokenAddress,
                    apr,
                }));
            })
            .flat()
            .filter((item): item is NonNullable<typeof item> => !!item)
            .filter((item, index, self) => self.findIndex((entry) => entry.address === item.address) === index);

        // Fetch also tokens based on the names containing aave

        return aprEntries;
    } catch (e) {
        throw Error(`Failed to fetch Aave APR in subgraph ${subgraphUrl}: ${(e as Error).message}`);
    }
};

const getDbTokenMappings = async (chain: Chain) => {
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
                .filter((token) => token.token.name.toLowerCase().match('aave') && token.token.underlyingTokenAddress)
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

    const aTokenToWrappers = wrapperToUnderlying.reduce(
        (agg, [wrapper], index) => {
            agg[aTokens[index].toLowerCase()] ||= [];
            agg[aTokens[index].toLowerCase()].push(wrapper);
            return agg;
        },
        {} as Record<string, string[]>,
    );

    const mappedTokens = Object.keys(aTokenToWrappers)
        .map((aToken) => {
            const wrappers = aTokenToWrappers[aToken];
            const underlyingMap = wrapperToUnderlying.find(([wrapper]) => wrapper === wrappers[0]);
            const underlying = underlyingMap ? underlyingMap[1] : undefined;

            if (!underlying) return;

            return {
                aTokenAddress: aToken,
                underlyingAssetAddress: underlying,
                wrappedTokens: Object.fromEntries(aTokenToWrappers[aToken].map((wrapper) => [wrapper, wrapper])),
            };
        })
        .filter((t): t is NonNullable<typeof t> => !!t);

    return mappedTokens;
};

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
