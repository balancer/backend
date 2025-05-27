import type { Address } from 'viem';
import { createPublicClient, http, zeroAddress } from 'viem';
import { CHAINS, isSameAddress, balancerV3Contracts, vaultExtensionAbi_V3 } from '@balancer/sdk';

import type { PoolBase, TestBase } from '../../types';
import { WeightedPool } from './weightedPool';
import { StablePool } from './stablePool';
import { BufferPool } from './buffer';
import { GyroECLPPool } from './gyroECLP';
import { LiquidityBootstrappingPool } from './liquidityBootstrappingPool';
import { ReClammPool } from './reClamm';
import { QuantAmmPool } from './quantAmm';

export async function getPool(
    rpcUrl: string,
    chainId: number,
    blockNumber: bigint,
    poolType: string,
    poolAddress: Address,
): Promise<PoolBase & TestBase> {
    // Find onchain data fetching via pool type
    const poolData: Record<
        string,
        WeightedPool | StablePool | BufferPool | GyroECLPPool | LiquidityBootstrappingPool | ReClammPool | QuantAmmPool
    > = {
        WEIGHTED: new WeightedPool(rpcUrl, chainId),
        STABLE: new StablePool(rpcUrl, chainId),
        Buffer: new BufferPool(rpcUrl, chainId),
        GYROE: new GyroECLPPool(rpcUrl, chainId),
        LIQUIDITY_BOOTSTRAPPING: new LiquidityBootstrappingPool(rpcUrl, chainId),
        RECLAMM: new ReClammPool(rpcUrl, chainId),
        QUANT_AMM_WEIGHTED: new QuantAmmPool(rpcUrl, chainId),
    };
    if (!poolData[poolType]) throw new Error(`getPool: Unsupported pool type: ${poolType}`);

    console.log('Fetching pool data...');
    const immutable = await poolData[poolType].fetchImmutableData(poolAddress, blockNumber);
    const mutable = await poolData[poolType].fetchMutableData(poolAddress, blockNumber);
    const hooksContract = await fetchHookAddress(poolType, rpcUrl, chainId, poolAddress, blockNumber);

    console.log('Done');

    return {
        chainId,
        blockNumber,
        poolType,
        poolAddress,
        hook: hooksContract ? { address: hooksContract.toLowerCase() } : undefined,
        ...immutable,
        ...mutable,
    };
}

async function fetchHookAddress(
    poolType: string,
    rpcUrl: string,
    chainId: number,
    poolAddress: Address,
    blockNumber: bigint,
): Promise<Address | undefined> {
    let hooksContract: Address | undefined;

    if (poolType !== 'Buffer') {
        const publicClient = createPublicClient({
            transport: http(rpcUrl),
            chain: CHAINS[chainId],
        });
        ({ hooksContract } = await publicClient.readContract({
            address: balancerV3Contracts.Vault[chainId as keyof typeof balancerV3Contracts.Vault],
            abi: vaultExtensionAbi_V3,
            functionName: 'getHooksConfig',
            args: [poolAddress],
            blockNumber,
        }));
    }

    if (!hooksContract || isSameAddress(hooksContract, zeroAddress) || isSameAddress(hooksContract, poolAddress)) {
        return undefined;
    }

    return hooksContract;
}
