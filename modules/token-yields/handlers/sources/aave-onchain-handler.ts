import * as aaveAddresses from '@bgd-labs/aave-address-book';
import { Chain } from '@prisma/client';
import { TokenYieldHandler } from '../../types';
import aaveUiPoolDataProvider from './abis/aave-ui-pool-data-provider';
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
        const tokens = await getTokenMappings(chain);

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

        return tokens
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

const getTokenMappings = async (chain: Chain) => {
    const assets = mapChainToAaveKeys[chain as keyof typeof mapChainToAaveKeys]?.ASSETS;

    if (!assets) return [];

    const mappings = Object.values(assets)
        .map((asset) => ({
            aToken: asset.A_TOKEN.toLowerCase(),
            underlyingAsset: asset.UNDERLYING.toLowerCase(),
            wrappers: [asset.STATIC_A_TOKEN?.toLowerCase(), asset.STATA_TOKEN?.toLowerCase()].filter((w) => !!w),
        }))
        .filter((w) => w.wrappers.length > 0);

    return mappings;
};
