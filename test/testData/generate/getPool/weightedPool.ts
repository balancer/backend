import { type PublicClient, createPublicClient, http, type Address, parseAbi, type Chain } from 'viem';
import { CHAINS, VAULT_V3, vaultExtensionAbi_V3 } from '@balancer/sdk';

import { TransformBigintToString } from '../../types';
import { vaultExplorerAbi } from '../abi/vaultExplorer';

export type WeightedImmutable = {
    tokens: bigint[];
    scalingFactors: bigint[];
    weights: bigint[];
};

type WeightedMutable = {
    swapFee: bigint;
    totalSupply: bigint;
    balancesLiveScaled18: bigint[];
    tokenRates: bigint[];
    aggregateSwapFee: bigint;
};

export class WeightedPool {
    client: PublicClient;
    vault: Address;

    constructor(public rpcUrl: string, public chainId: number) {
        this.client = createPublicClient({
            transport: http(this.rpcUrl),
            chain: CHAINS[this.chainId] as Chain,
        });
        this.vault = VAULT_V3[this.chainId];
    }

    async fetchImmutableData(
        address: Address,
        blockNumber: bigint,
    ): Promise<TransformBigintToString<WeightedImmutable>> {
        const poolTokensCall = {
            address: this.vault,
            abi: vaultExtensionAbi_V3,
            functionName: 'getPoolTokenInfo',
            args: [address],
        } as const;
        const tokenRatesCall = {
            address: this.vault,
            abi: vaultExtensionAbi_V3,
            functionName: 'getPoolTokenRates',
            args: [address],
        } as const;
        const tokenWeightsCall = {
            address,
            abi: parseAbi(['function getNormalizedWeights() external view returns (uint256[] memory)']),
            functionName: 'getNormalizedWeights',
        } as const;

        const multicallResult = await this.client.multicall({
            contracts: [poolTokensCall, tokenRatesCall, tokenWeightsCall],
            allowFailure: false,
            blockNumber,
        });
        return {
            tokens: multicallResult[0][0].map((token) => token),
            scalingFactors: multicallResult[1][0].map((sf) => sf.toString()),
            weights: multicallResult[2].map((w) => w.toString()),
        };
    }

    async fetchMutableData(address: Address, blockNumber: bigint): Promise<TransformBigintToString<WeightedMutable>> {
        const totalSupplyCall = {
            address: this.vault,
            abi: parseAbi(['function totalSupply(address token) external view returns (uint256)']),
            functionName: 'totalSupply',
            args: [address],
        } as const;
        const liveBalancesCall = {
            address: this.vault,
            abi: vaultExtensionAbi_V3,
            functionName: 'getCurrentLiveBalances',
            args: [address],
        } as const;
        const tokenRatesCall = {
            address: this.vault,
            abi: vaultExtensionAbi_V3,
            functionName: 'getPoolTokenRates',
            args: [address],
        } as const;
        const poolConfigCall = {
            address: this.vault,
            abi: vaultExplorerAbi,
            functionName: 'getPoolConfig',
            args: [address],
        } as const;

        const multicallResult = await this.client.multicall({
            contracts: [totalSupplyCall, liveBalancesCall, tokenRatesCall, poolConfigCall],
            allowFailure: false,
            blockNumber,
        });
        return {
            swapFee: multicallResult[3].staticSwapFeePercentage.toString(),
            totalSupply: multicallResult[0].toString(),
            balancesLiveScaled18: multicallResult[1].map((b) => b.toString()),
            tokenRates: multicallResult[2][1].map((b) => b.toString()),
            aggregateSwapFee: multicallResult[3].aggregateSwapFeePercentage.toString(),
        };
    }
}
