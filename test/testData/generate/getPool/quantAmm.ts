import { PublicClient, Address, http, createPublicClient, Chain } from 'viem';
import { VAULT_V3 } from '@balancer/sdk';
import { CHAINS } from '@balancer/sdk';

import { TransformBigintToString } from '../../types';
import { quantAmmAbi } from '../abi/quantAmm';
import { vaultExplorerAbi } from '../abi/vaultExplorer';

export interface QuantAmmMutableData {
    balancesLiveScaled18: bigint[];
    tokenRates: bigint[];
    totalSupply: bigint;
    firstFourWeightsAndMultipliers: bigint[];
    secondFourWeightsAndMultipliers: bigint[];
    lastUpdateTime: bigint;
    lastInteropTime: bigint;
    currentTimestamp: bigint;
}

export interface QuantAmmImmutableData {
    tokens: string[];
    maxTradeSizeRatio: bigint;
    scalingFactors: bigint[];
    swapFee: bigint;
}

export class QuantAmmPool {
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
        blockNumber?: bigint,
    ): Promise<TransformBigintToString<QuantAmmImmutableData>> {
        const immutableDataCall = {
            address,
            abi: quantAmmAbi,
            functionName: 'getQuantAMMWeightedPoolImmutableData',
            blockNumber,
        } as const;

        const scalingFactorsCall = {
            address: this.vault,
            abi: vaultExplorerAbi,
            functionName: 'getPoolTokenRates',
            args: [address],
            blockNumber,
        } as const;

        const staticSwapFeePercentageCall = {
            address,
            abi: quantAmmAbi,
            functionName: 'getStaticSwapFeePercentage',
            blockNumber,
        } as const;

        const multicallResult = await this.client.multicall({
            contracts: [immutableDataCall, scalingFactorsCall, staticSwapFeePercentageCall],
            allowFailure: false,
            blockNumber,
        });

        return {
            tokens: multicallResult[0].tokens.map((token: string) => token.toLowerCase()),
            maxTradeSizeRatio: multicallResult[0].maxTradeSizeRatio.toString(),
            scalingFactors: multicallResult[1][0].map((sf) => sf.toString()),
            swapFee: multicallResult[2].toString(),
        };
    }

    async fetchMutableData(
        address: Address,
        blockNumber?: bigint,
    ): Promise<TransformBigintToString<QuantAmmMutableData>> {
        const data = await this.client.readContract({
            address,
            abi: quantAmmAbi,
            functionName: 'getQuantAMMWeightedPoolDynamicData',
            blockNumber,
        });

        const block = await this.client.getBlock({
            blockNumber,
        });

        return {
            balancesLiveScaled18: data.balancesLiveScaled18.map((b) => b.toString()),
            tokenRates: data.tokenRates.map((b) => b.toString()),
            totalSupply: data.totalSupply.toString(),
            firstFourWeightsAndMultipliers: data.firstFourWeightsAndMultipliers.map((b) => b.toString()),
            secondFourWeightsAndMultipliers: data.secondFourWeightsAndMultipliers.map((b) => b.toString()),
            lastUpdateTime: data.lastUpdateTime.toString(),
            lastInteropTime: data.lastInteropTime.toString(),
            currentTimestamp: block.timestamp.toString(),
        };
    }
}
