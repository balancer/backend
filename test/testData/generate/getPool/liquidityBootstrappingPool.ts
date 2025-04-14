import { PublicClient, createPublicClient, http, type Address, parseAbi, type Chain } from 'viem';
import { CHAINS } from '@balancer/sdk';
import { balancerV3Contracts, vaultExtensionAbi_V3 } from '@balancer/sdk';
import { liquidityBootstrappingAbi } from '../abi/liquidityBootstrapping';

export type LBPoolImmutableData = {
    tokens: string[];
    decimalScalingFactors: bigint[];
    startWeights: bigint[];
    endWeights: bigint[];
    startTime: bigint;
    endTime: bigint;
    projectTokenIndex: number;
    reserveTokenIndex: number;
    isProjectTokenSwapInBlocked: boolean;
};

export type LBPoolDynamicData = {
    balancesLiveScaled18: bigint[];
    normalizedWeights: bigint[];
    staticSwapFeePercentage: bigint;
    totalSupply: bigint;
    isPoolInitialized: boolean;
    isPoolPaused: boolean;
    isPoolInRecoveryMode: boolean;
    isSwapEnabled: boolean;
};

type TransformBigintToString<T> = {
    [K in keyof T]: T[K] extends bigint ? string : T[K] extends bigint[] ? string[] : T[K];
};

export class LiquidityBootstrappingPool {
    client: PublicClient;
    vault: Address;

    constructor(public rpcUrl: string, public chainId: number) {
        this.client = createPublicClient({
            transport: http(this.rpcUrl),
            chain: CHAINS[this.chainId] as Chain,
        });
        this.vault = balancerV3Contracts.Vault[this.chainId];
    }

    /**
     * Fetch immutable data from the pool contract.
     * This function makes a single on-chain call to `getLBPoolImmutableData`.
     */
    async fetchImmutableData(
        address: Address,
        blockNumber: bigint,
    ): Promise<
        TransformBigintToString<Omit<LBPoolImmutableData, 'decimalScalingFactors'> & { scalingFactors: string[] }>
    > {
        const call = {
            address,
            abi: liquidityBootstrappingAbi,
            functionName: 'getLBPoolImmutableData',
        } as const;

        const {
            tokens,
            decimalScalingFactors,
            startWeights,
            endWeights,
            startTime,
            endTime,
            projectTokenIndex,
            reserveTokenIndex,
            isProjectTokenSwapInBlocked,
        } = (await this.client.readContract({
            ...call,
            blockNumber,
        })) as LBPoolImmutableData;

        return {
            tokens: [...tokens],
            scalingFactors: decimalScalingFactors.map((sf) => sf.toString()),
            startWeights: startWeights.map((weight) => weight.toString()),
            endWeights: endWeights.map((weight) => weight.toString()),
            startTime: startTime.toString(),
            endTime: endTime.toString(),
            projectTokenIndex: Number(projectTokenIndex),
            reserveTokenIndex: Number(reserveTokenIndex),
            isProjectTokenSwapInBlocked,
        };
    }

    /**
     * Fetch dynamic data from the pool contract.
     * This function makes a single on-chain call to `getLBPoolDynamicData`.
     */
    async fetchMutableData(
        address: Address,
        blockNumber: bigint,
    ): Promise<
        TransformBigintToString<
            Omit<LBPoolDynamicData, 'normalizedWeights' | 'staticSwapFeePercentage'> & {
                weights: string[];
                swapFee: string;
                tokenRates: string[];
            }
        >
    > {
        const dynamicDataCall = {
            address,
            abi: liquidityBootstrappingAbi,
            functionName: 'getLBPoolDynamicData',
        } as const;

        console.log('HELLO');

        const tokenRatesCall = {
            address: this.vault,
            abi: vaultExtensionAbi_V3,
            functionName: 'getPoolTokenRates',
            args: [address],
        } as const;

        const multicallResult = await this.client.multicall({
            contracts: [dynamicDataCall, tokenRatesCall],
            allowFailure: false,
            blockNumber,
        });

        const {
            balancesLiveScaled18,
            normalizedWeights,
            staticSwapFeePercentage,
            totalSupply,
            isPoolInitialized,
            isPoolPaused,
            isPoolInRecoveryMode,
            isSwapEnabled,
        } = multicallResult[0] as LBPoolDynamicData;

        const tokenRates = multicallResult[1][1] as bigint[];

        return {
            balancesLiveScaled18: balancesLiveScaled18.map((b) => b.toString()),
            weights: normalizedWeights.map((w) => w.toString()),
            swapFee: staticSwapFeePercentage.toString(),
            totalSupply: totalSupply.toString(),
            tokenRates: tokenRates.map((rate) => rate.toString()),
            isPoolInitialized,
            isPoolPaused,
            isPoolInRecoveryMode,
            isSwapEnabled,
        };
    }
}
