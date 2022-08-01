import { BalancerSdkConfig, Network, SubgraphPoolBase } from '@balancer-labs/sdk';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPoolType } from '@prisma/client';
import { tokenPriceService } from '../../../legacy/token-price/token-price.service';
import { networkConfig } from '../../config/network-config';

export const BALANCER_SDK_CONFIG: { [chainId: string]: BalancerSdkConfig } = {
    '250': {
        network: {
            chainId: 250 as Network,
            addresses: {
                contracts: {
                    vault: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
                    multicall: '0x66335d7ad8011f6aa3f48aadcb523b62b38ed961',
                    batchRelayer: '0xC852F984CA3310AFc596adeB17EfcB0542646920',
                },
                tokens: {
                    wrappedNativeAsset: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
                },
                linearFactories: {
                    '0x1f73ae6ed391a2b1e84ff988a1bb5394b78a4a71': 'yearn',
                    '0xba306e3cf84751d8ef5e812c18caa6c567c783e8': 'boo',
                },
            },
            urls: {
                subgraph: 'https://backend.beets-ftm-node.com/graphql',
            },
            pools: {
                staBal3Pool: {
                    id: '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757000000000000000000000187',
                    address: '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757',
                },
            },
            fBeets: {
                address: '0xfcef8a994209d6916EB2C86cDD2AFD60Aa6F54b1',
                farmId: 22,
                poolId: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
            },
        },
        rpcUrl: 'https://graph-node.beets-ftm-node.com/rpc',
        sor: {
            tokenPriceService: {
                getNativeAssetPriceInToken: async (tokenAddress: string) => {
                    try {
                        const tokenPrices = await tokenPriceService.getTokenPrices();
                        tokenPriceService.getPriceForToken(tokenPrices, networkConfig.chain.wrappedNativeAssetAddress);
                        const nativeAssetPrice = tokenPriceService.getPriceForToken(
                            tokenPrices,
                            networkConfig.chain.wrappedNativeAssetAddress,
                        );
                        const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, tokenAddress) || 1;

                        return `${nativeAssetPrice / tokenPrice}`;
                    } catch {
                        return '0';
                    }
                },
            },
            poolDataService: {
                getPools: async () => {
                    const pools = await prisma.prismaPool.findMany({
                        where: {
                            dynamicData: {
                                totalSharesNum: {
                                    gt: 0.000000000001,
                                },
                            },
                            categories: {
                                none: { category: 'BLACK_LISTED' },
                            },
                        },
                        include: {
                            dynamicData: true,
                            stableDynamicData: true,
                            linearDynamicData: true,
                            linearData: true,
                            tokens: {
                                include: { dynamicData: true, token: true },
                                orderBy: { index: 'asc' },
                            },
                        },
                    });

                    const mappedPools: SubgraphPoolBase[] = pools.map((pool) => ({
                        ...pool,
                        ...pool.dynamicData!,
                        ...pool.stableDynamicData,
                        ...pool.linearData,
                        ...pool.linearDynamicData,
                        totalLiquidity: `${pool.dynamicData!.totalLiquidity}`,
                        factory: pool.factory || undefined,
                        poolType: mapPoolTypeToSubgraphPoolType(pool.type),
                        tokensList: pool.tokens.map((token) => token.address),
                        totalWeight: '1', //TODO: properly calculate this
                        tokens: pool.tokens.map((token) => ({
                            ...token.token!,
                            ...token.dynamicData!,
                        })),
                    }));

                    return mappedPools;
                },
            },
        },
    },
    '10': {
        network: {
            chainId: 10 as Network,
            addresses: {
                contracts: {
                    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
                    multicall: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
                    batchRelayer: '0x0000000000000000000000000000000000000000',
                },
                tokens: {
                    wrappedNativeAsset: '0x4200000000000000000000000000000000000006',
                },
                linearFactories: {},
            },
            urls: {
                subgraph: 'https://backend.beets-ftm-node.com/graphql',
            },
            pools: {},
            fBeets: {
                address: '0xfcef8a994209d6916EB2C86cDD2AFD60Aa6F54b1',
                farmId: 22,
                poolId: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
            },
        },
        rpcUrl: 'https://mainnet.optimism.io/',
        sor: {
            tokenPriceService: {
                getNativeAssetPriceInToken: async (tokenAddress: string) => {
                    try {
                        const tokenPrices = await tokenPriceService.getTokenPrices();
                        tokenPriceService.getPriceForToken(tokenPrices, networkConfig.chain.wrappedNativeAssetAddress);
                        const nativeAssetPrice = tokenPriceService.getPriceForToken(
                            tokenPrices,
                            networkConfig.chain.wrappedNativeAssetAddress,
                        );
                        const tokenPrice = tokenPriceService.getPriceForToken(tokenPrices, tokenAddress) || 1;

                        return `${nativeAssetPrice / tokenPrice}`;
                    } catch {
                        return '0';
                    }
                },
            },
            poolDataService: {
                getPools: async () => {
                    const pools = await prisma.prismaPool.findMany({
                        where: {
                            dynamicData: {
                                totalSharesNum: {
                                    gt: 0.000000000001,
                                },
                            },
                            categories: {
                                none: { category: 'BLACK_LISTED' },
                            },
                        },
                        include: {
                            dynamicData: true,
                            stableDynamicData: true,
                            linearDynamicData: true,
                            linearData: true,
                            tokens: {
                                include: { dynamicData: true, token: true },
                                orderBy: { index: 'asc' },
                            },
                        },
                    });

                    const mappedPools: SubgraphPoolBase[] = pools.map((pool) => ({
                        ...pool,
                        ...pool.dynamicData!,
                        ...pool.stableDynamicData,
                        ...pool.linearData,
                        ...pool.linearDynamicData,
                        totalLiquidity: `${pool.dynamicData!.totalLiquidity}`,
                        factory: pool.factory || undefined,
                        poolType: mapPoolTypeToSubgraphPoolType(pool.type),
                        tokensList: pool.tokens.map((token) => token.address),
                        totalWeight: '1', //TODO: properly calculate this
                        tokens: pool.tokens.map((token) => ({
                            ...token.token!,
                            ...token.dynamicData!,
                        })),
                    }));

                    return mappedPools;
                },
            },
        },
    },
};

function mapPoolTypeToSubgraphPoolType(poolType: PrismaPoolType): string {
    switch (poolType) {
        case 'WEIGHTED':
            return 'Weighted';
        case 'LIQUIDITY_BOOTSTRAPPING':
            return 'LiquidityBootstrapping';
        case 'STABLE':
            return 'Stable';
        case 'META_STABLE':
            return 'MetaStable';
        case 'PHANTOM_STABLE':
            return 'StablePhantom';
        case 'LINEAR':
            return 'Linear';
        case 'ELEMENT':
            return 'Element';
        case 'INVESTMENT':
            return 'Investment';
    }

    return 'UNKNOWN';
}
