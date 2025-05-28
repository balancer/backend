import { type PublicClient, createPublicClient, http, type Address, parseAbi, type Chain } from 'viem';
import { CHAINS, VAULT_V3, vaultExtensionAbi_V3 } from '@balancer/sdk';

import { TransformBigintToString } from '../../types';
import { vaultExplorerAbi } from '../abi/vaultExplorer';

type StableMutable = {
    amp: bigint;
    swapFee: bigint;
    totalSupply: bigint;
    balancesLiveScaled18: bigint[];
    tokenRates: bigint[];
    aggregateSwapFee: bigint;
};

type StableImmutable = {
    tokens: bigint[];
    scalingFactors: bigint[];
};

export class StablePool {
    client: PublicClient;
    vault: Address;

    constructor(public rpcUrl: string, public chainId: number) {
        this.client = createPublicClient({
            transport: http(this.rpcUrl),
            chain: CHAINS[this.chainId] as Chain,
        });
        this.vault = VAULT_V3[this.chainId];
    }

    async fetchImmutableData(address: Address, blockNumber: bigint): Promise<TransformBigintToString<StableImmutable>> {
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
        const multicallResult = await this.client.multicall({
            contracts: [poolTokensCall, tokenRatesCall],
            allowFailure: false,
            blockNumber,
        });
        return {
            tokens: multicallResult[0][0].map((token) => token),
            scalingFactors: multicallResult[1][0].map((sf) => sf.toString()),
        };
    }

    async fetchMutableData(address: Address, blockNumber: bigint): Promise<TransformBigintToString<StableMutable>> {
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
        const amplificationParameterCall = {
            address,
            abi: parseAbi([
                'function getAmplificationParameter() external view returns (uint256 value, bool isUpdating, uint256 precision)',
            ]),
            functionName: 'getAmplificationParameter',
        } as const;
        const poolConfigCall = {
            address: this.vault,
            abi: vaultExplorerAbi,
            functionName: 'getPoolConfig',
            args: [address],
        } as const;

        const multicallResult = await this.client.multicall({
            contracts: [totalSupplyCall, liveBalancesCall, tokenRatesCall, amplificationParameterCall, poolConfigCall],
            allowFailure: false,
            blockNumber,
        });
        return {
            swapFee: multicallResult[4].staticSwapFeePercentage.toString(),
            totalSupply: multicallResult[0].toString(),
            balancesLiveScaled18: multicallResult[1].map((b) => b.toString()),
            tokenRates: multicallResult[2][1].map((b) => b.toString()),
            amp: multicallResult[3][0].toString(),
            aggregateSwapFee: multicallResult[4].aggregateSwapFeePercentage.toString(),
        };
    }
}
