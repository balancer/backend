import { createPublicClient, erc20Abi, http, type Address, type Chain } from 'viem';
import { CHAINS } from '@balancer/sdk';
import type { PoolBase } from '../types';

export async function getUnderlyingTokens(
    pools: PoolBase[],
    rpcUrl: string,
    chainId: number,
): Promise<{ address: Address; decimals: number }[]> {
    const bufferPools = pools.filter((pool) => pool.poolType === 'Buffer') as unknown as { tokens: Address[] }[];

    if (bufferPools.length === 0) {
        return [];
    }

    const underlyingTokens = bufferPools.flatMap((pool) => pool.tokens[1]);

    const client = createPublicClient({
        chain: CHAINS[chainId] as Chain,
        transport: http(rpcUrl),
    });

    const decimals = await Promise.all(
        underlyingTokens.map((token) =>
            client.readContract({
                address: token,
                abi: erc20Abi,
                functionName: 'decimals',
            }),
        ),
    );

    return underlyingTokens.map((token, index) => ({
        address: token,
        decimals: decimals[index],
    }));
}
