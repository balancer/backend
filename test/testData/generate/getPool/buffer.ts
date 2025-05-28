import { type PublicClient, createPublicClient, http, type Address, type Chain, erc4626Abi, erc20Abi } from 'viem';
import { CHAINS, VAULT_V3 } from '@balancer/sdk';

import { TransformBigintToString } from '../../types';

export type BufferImmutable = {
    tokens: Address[];
    decimals: number[]; // this is an addition required to scale the rate and transform from/to fixedPoint/floatPoint
};

type BufferMutable = {
    rate: bigint;
};

export class BufferPool {
    client: PublicClient;
    vault: Address;

    constructor(public rpcUrl: string, public chainId: number) {
        this.client = createPublicClient({
            transport: http(this.rpcUrl),
            chain: CHAINS[this.chainId] as Chain,
        });
        this.vault = VAULT_V3[this.chainId];
    }

    async fetchImmutableData(address: Address, blockNumber: bigint): Promise<TransformBigintToString<BufferImmutable>> {
        const asset = await this.client.readContract({
            address,
            abi: erc4626Abi,
            functionName: 'asset',
            blockNumber,
        });

        const mainTokenDecimals = await this.client.readContract({
            address,
            abi: erc20Abi,
            functionName: 'decimals',
            blockNumber,
        });

        const underlyingTokenDecimals = await this.client.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'decimals',
            blockNumber,
        });

        return {
            tokens: [address, asset],
            decimals: [mainTokenDecimals, underlyingTokenDecimals],
        };
    }

    async fetchMutableData(address: Address, blockNumber: bigint): Promise<TransformBigintToString<BufferMutable>> {
        const rate = await this.client.readContract({
            address,
            abi: erc4626Abi,
            functionName: 'convertToAssets',
            args: [1000000000000000000n],
            blockNumber,
        });
        return {
            rate: rate.toString(),
        };
    }
}
