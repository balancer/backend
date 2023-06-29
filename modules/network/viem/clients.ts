import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export function createHttpClient(httpRpc: string) {
    return createPublicClient({
        batch: {
            multicall: { batchSize: 500 },
        },
        chain: mainnet,
        transport: http(httpRpc),
    });
}
