import * as aaveAddresses from '@bgd-labs/aave-address-book';
import { Hex, parseAbi } from 'viem';
import { Chain } from '@prisma/client';
import { TokenYieldHandler } from '../../types';
import aaveUiPoolDataProvider from './abis/aave-ui-pool-data-provider';
import { prisma } from '../../../../prisma/prisma-client';
import { getViemClient } from '../../../sources/viem-client';

const mapChainToAaveKeys = {
    [Chain.ARBITRUM]: aaveAddresses.AaveV3Arbitrum,
    [Chain.AVALANCHE]: aaveAddresses.AaveV3Avalanche,
    [Chain.BASE]: aaveAddresses.AaveV3Base,
    [Chain.GNOSIS]: aaveAddresses.AaveV3Gnosis,
    [Chain.MAINNET]: aaveAddresses.AaveV3Ethereum,
    [Chain.OPTIMISM]: aaveAddresses.AaveV3Optimism,
    [Chain.PLASMA]: aaveAddresses.AaveV3Plasma,
    [Chain.POLYGON]: aaveAddresses.AaveV3Polygon,
    [Chain.SEPOLIA]: aaveAddresses.AaveV3Sepolia,
    [Chain.SONIC]: aaveAddresses.AaveV3Sonic,
};

export const aaveOnchainHandler: TokenYieldHandler = async ({ chain }: { chain: Chain }) => {
    try {
        const dbTokens = await getDbTokenMappings(chain);

        const client = getViemClient(chain as Chain);
        const addresses = mapChainToAaveKeys[chain as keyof typeof mapChainToAaveKeys];

        if (!addresses) {
            return [];
        }

        const reserves = await client
            .readContract({
                address: addresses.UI_POOL_DATA_PROVIDER,
                abi: aaveUiPoolDataProvider,
                functionName: 'getReservesData',
                args: [addresses.POOL_ADDRESSES_PROVIDER],
            })
            .then(
                (list) =>
                    new Map(
                        list[0].map((item) => [item.underlyingAsset.toLowerCase(), Number(item.liquidityRate) / 1e27]),
                    ),
            );

        // Map reserve assets to tokens
        return dbTokens
            .flatMap((token) => {
                const apr = reserves.get(token.underlyingAsset);
                if (!apr) return;

                return token.wrappers.map((wrapper) => ({
                    address: wrapper,
                    apr,
                }));
            })
            .filter((v) => !!v);
    } catch (e) {
        throw Error(`Failed to fetch Aave onchain APR ${chain}: ${(e as Error).message}`);
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

    const aTokens = await client.multicall({
        contracts,
        allowFailure: false,
        multicallAddress: '0xca11bde05977b3631167028862be2a173976ca11',
    });

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
                aToken: aToken as Hex,
                underlyingAsset: underlying as Hex,
                wrappers: wrappers as Hex[],
            };
        })
        .filter((t): t is NonNullable<typeof t> => !!t);

    return mappedTokens;
};
