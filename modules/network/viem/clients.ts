import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export function buildPublicClient(httpRpc: string) {
    return createPublicClient({
        batch: {
            multicall: { batchSize: 500 },
        },
        chain: mainnet,
        transport: http(httpRpc),
    });
}

export function testPublicClient(httpRpc: string = 'http://127.0.0.1:8555') {
    // const httpRpc = 'https://cloudflare-eth.com';
    // const httpRpc = 'https://mainnet.infura.io/v3/bbfff27eb2024f0684733dc281855683';
    return buildPublicClient('http://127.0.0.1:8555');
}
