import { createPublicClient, defineChain, http, PublicClient } from 'viem';
import {
    arbitrum,
    avalanche,
    base,
    fantom,
    gnosis,
    mainnet,
    optimism,
    polygon,
    polygonZkEvm,
    sepolia,
    fraxtal,
    mode,
    sonic,
    plasma,
    xLayer,
} from 'viem/chains';
import { Chain } from '@prisma/client';
import config from '../../config';

export type ViemClient = ReturnType<typeof getViemClient>;

// Use this interface for easier mocking
export interface IViemClient {
    multicall: PublicClient['multicall'];
    readContract: PublicClient['readContract'];
}

const chain2ViemChain = {
    [Chain.MAINNET]: mainnet,
    [Chain.SEPOLIA]: sepolia,
    [Chain.ARBITRUM]: arbitrum,
    [Chain.AVALANCHE]: avalanche,
    [Chain.BASE]: base,
    [Chain.FANTOM]: fantom,
    [Chain.GNOSIS]: gnosis,
    [Chain.OPTIMISM]: optimism,
    [Chain.POLYGON]: polygon,
    [Chain.ZKEVM]: polygonZkEvm,
    [Chain.FRAXTAL]: fraxtal,
    [Chain.MODE]: mode,
    [Chain.SONIC]: sonic,
    [Chain.XLAYER]: xLayer,
    [Chain.HYPEREVM]: defineChain({
        id: 999,
        name: 'hyperevm',
        nativeCurrency: {
            decimals: 18,
            name: 'Hyperliquid',
            symbol: 'HYPER',
        },
        rpcUrls: {
            default: {
                http: [config[Chain.HYPEREVM].rpcUrl],
            },
        },
        blockExplorers: {
            default: {
                name: 'Hyper Block Explorer',
                url: 'https://www.hyperscan.com',
            },
        },
        contracts: {
            multicall3: {
                address: config[Chain.HYPEREVM].multicall3 as `0x${string}`,
            },
        },
    }),
    [Chain.PLASMA]: defineChain({
        id: 9745,
        name: 'plasma',
        nativeCurrency: {
            decimals: 18,
            name: 'Plasma',
            symbol: 'PLASMA',
        },
        rpcUrls: {
            default: {
                http: [config[Chain.PLASMA].rpcUrl],
            },
        },
        blockExplorers: {
            default: {
                name: 'Plasma Block Explorer',
                url: 'https://plasmascan.to/',
            },
        },
        contracts: {
            multicall3: {
                address: config[Chain.PLASMA].multicall3 as `0x${string}`,
            },
        },
    }),
};

export const getViemClient = (chain: Chain, options?: { multicallBatch?: boolean; jsonRpcBatch?: boolean }) => {
    return createPublicClient({
        chain: chain2ViemChain[chain],
        batch: options?.multicallBatch ? { multicall: true } : undefined,
        transport: http(config[chain]?.rpcUrl, {
            batch: options?.jsonRpcBatch || undefined,
            onFetchRequest(request) {
                if (process.env.DEBUG) {
                    const reader = request.body?.getReader();
                    if (!reader) {
                        return;
                    }
                    let body = '';

                    reader
                        .read()
                        .then(function processText({ done, value }) {
                            if (done) {
                                return;
                            }
                            // value for fetch streams is a Uint8Array
                            body += value;
                            reader.read().then(processText);
                        })
                        .then(() => {
                            const json = JSON.parse(
                                body
                                    .split(',')
                                    .map((code) => String.fromCharCode(parseInt(code, 10)))
                                    .join(''),
                            );
                            try {
                                console.log(json['id'], json['method'], body.length, json['params'][0]['to']);
                            } catch (e) {
                                console.log(json['id'], json['method'], body.length);
                            }
                        });
                }
            },
        }),
    });
};
