import { providers } from 'ethers';
import { mainnetNetworkConfig } from '../modules/network/mainnet';

// anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/7gYoDJEw6-QyVP5hd2UfZyelzDIDemGz --port 8555 --fork-block-number=17769946

// In CI we will use http://127.0.0.1:8555 to use the anvil fork;
// const httpRpc = process.env.TEST_RPC_URL || 'https://cloudflare-eth.com';
const defaultAnvilRpcUrl = 'http://127.0.0.1:8555';

export function setMainnetRpcProviderForTesting(httpRpc = defaultAnvilRpcUrl) {
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    mainnetNetworkConfig.provider = getRpcProvider(httpRpc);
}

export function getRpcProvider(httpRpc = defaultAnvilRpcUrl) {
    return new providers.JsonRpcProvider(httpRpc);
}
