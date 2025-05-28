import { type PublicClient, createPublicClient, http, type Address, parseAbi, type Chain } from 'viem';
import { CHAINS, VAULT_V3, vaultExtensionAbi_V3 } from '@balancer/sdk';

import { TransformBigintToString } from '../../types';
import { vaultExplorerAbi } from '../abi/vaultExplorer';
import { gyroECLPAbi } from '../abi/gyroECLP';

type GyroECLPMutable = {
    swapFee: bigint;
    totalSupply: bigint;
    balancesLiveScaled18: bigint[];
    tokenRates: bigint[];
    aggregateSwapFee: bigint;
};

type GyroECLPImmutable = {
    tokens: bigint[];
    scalingFactors: bigint[];
    paramsAlpha: bigint;
    paramsBeta: bigint;
    paramsC: bigint;
    paramsS: bigint;
    paramsLambda: bigint;
    tauAlphaX: bigint;
    tauAlphaY: bigint;
    tauBetaX: bigint;
    tauBetaY: bigint;
    u: bigint;
    v: bigint;
    w: bigint;
    z: bigint;
    dSq: bigint;
};

export class GyroECLPPool {
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
    ): Promise<TransformBigintToString<GyroECLPImmutable>> {
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
        const immutableDataCall = {
            address,
            abi: gyroECLPAbi,
            functionName: 'getGyroECLPPoolImmutableData',
        } as const;
        const multicallResult = await this.client.multicall({
            contracts: [poolTokensCall, tokenRatesCall, immutableDataCall],
            allowFailure: false,
            blockNumber,
        });

        return {
            tokens: multicallResult[0][0].map((token) => token),
            scalingFactors: multicallResult[1][0].map((sf) => sf.toString()),
            paramsAlpha: multicallResult[2].paramsAlpha.toString(),
            paramsBeta: multicallResult[2].paramsBeta.toString(),
            paramsC: multicallResult[2].paramsC.toString(),
            paramsS: multicallResult[2].paramsS.toString(),
            paramsLambda: multicallResult[2].paramsLambda.toString(),
            tauAlphaX: multicallResult[2].tauAlphaX.toString(),
            tauAlphaY: multicallResult[2].tauAlphaY.toString(),
            tauBetaX: multicallResult[2].tauBetaX.toString(),
            tauBetaY: multicallResult[2].tauBetaY.toString(),
            u: multicallResult[2].u.toString(),
            v: multicallResult[2].v.toString(),
            w: multicallResult[2].w.toString(),
            z: multicallResult[2].z.toString(),
            dSq: multicallResult[2].dSq.toString(),
        };
    }

    async fetchMutableData(address: Address, blockNumber: bigint): Promise<TransformBigintToString<GyroECLPMutable>> {
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
