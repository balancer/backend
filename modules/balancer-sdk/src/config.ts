import { BalancerSdkConfig, Network, SubgraphPoolBase } from '@balancer-labs/sdk';
import { env } from '../../../app/env';
import { tokenPriceService } from '../../token-price/token-price.service';
import { balancerService } from '../../balancer/balancer.service';

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
                        tokenPriceService.getPriceForToken(tokenPrices, env.WRAPPED_NATIVE_ASSET_ADDRESS);
                        const nativeAssetPrice = tokenPriceService.getPriceForToken(
                            tokenPrices,
                            env.WRAPPED_NATIVE_ASSET_ADDRESS,
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
                    const pools = (await balancerService.getPools()) as SubgraphPoolBase[];

                    return pools;
                },
            },
        },
    },
};
