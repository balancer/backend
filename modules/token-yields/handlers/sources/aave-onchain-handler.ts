import { TokenApr, TokenYieldHandler, AaveAddressBookEntry } from '../../types';
import aaveUiPoolDataProvider from './abis/aave-ui-pool-data-provider';
import aaveUiPoolDataProviderPlasma from './abis/aave-ui-pool-data-provider-plasma';
import { getViemClient } from '../../../sources/viem-client';
import { chainIdToChain } from '../../../network/chain-id-to-chain';

export const aaveOnchainHandler: TokenYieldHandler = async ({ markets }: { markets: AaveAddressBookEntry[] }) => {
    const tokenAprs: TokenApr[] = [];

    try {
        for (const market of markets) {
            const chain = chainIdToChain[market.CHAIN_ID];

            if (!chain || !market || !market?.ASSETS) {
                continue;
            }

            const tokens = await getTokenMappings(Object.values(market.ASSETS));

            const client = getViemClient(chain);

            const liquidityRates = await client
                .readContract({
                    address: market.UI_POOL_DATA_PROVIDER,
                    abi: chain === 'PLASMA' ? aaveUiPoolDataProviderPlasma : aaveUiPoolDataProvider,
                    functionName: 'getReservesData',
                    args: [market.POOL_ADDRESSES_PROVIDER],
                })
                .then(
                    (list) =>
                        new Map(
                            list[0].map((item) => [
                                item.underlyingAsset.toLowerCase(),
                                Number(item.liquidityRate) / 1e27,
                            ]),
                        ),
                );

            tokenAprs.push(
                ...tokens
                    .flatMap((token) => {
                        const apr = liquidityRates.get(token.underlyingAsset);

                        if (!apr) return;

                        return token.wrappers.map((wrapper) => ({
                            address: wrapper,
                            apr,
                        }));
                    })
                    .filter((v) => !!v),
            );
        }
    } catch (e) {
        throw Error(`Failed to fetch Aave onchain APR: ${(e as Error).message}`);
    }

    return tokenAprs;
};

const getTokenMappings = async (assets?: any[]) => {
    if (!assets || assets.length === 0) return [];

    const mappings = Object.values(assets)
        .map((asset) => ({
            aToken: asset.A_TOKEN.toLowerCase(),
            underlyingAsset: asset.UNDERLYING.toLowerCase(),
            wrappers: [asset.STATIC_A_TOKEN?.toLowerCase(), asset.STATA_TOKEN?.toLowerCase()].filter((w) => !!w),
        }))
        .filter((w) => w.wrappers.length > 0);

    return mappings;
};
