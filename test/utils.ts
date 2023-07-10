import { providers } from 'ethers';
import { mainnetNetworkConfig } from '../modules/network/mainnet';

const defaultAnvilRpcUrl = 'http://127.0.0.1:8555';

export function setMainnetRpcProviderForTesting(httpRpc = defaultAnvilRpcUrl) {
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    mainnetNetworkConfig.provider = getRpcProvider(httpRpc);
}

export function getRpcProvider(httpRpc = defaultAnvilRpcUrl) {
    return new providers.JsonRpcProvider(httpRpc);
}
