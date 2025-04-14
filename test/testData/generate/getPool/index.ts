import type { Address } from 'viem';
import { WeightedPool } from './weightedPool';
import { StablePool } from './stablePool';
import type { PoolBase, TestBase } from '../../types';
import { BufferPool } from './buffer';
import { GyroECLPPool } from './gyroECLP';
import { LiquidityBootstrappingPool } from './liquidityBootstrappingPool';

export async function getPool(
    rpcUrl: string,
    chainId: number,
    blockNumber: bigint,
    poolType: string,
    poolAddress: Address,
): Promise<PoolBase & TestBase> {
    // Find onchain data fetching via pool type
    const poolData: Record<string, WeightedPool | StablePool | BufferPool | GyroECLPPool | LiquidityBootstrappingPool> =
        {
            WEIGHTED: new WeightedPool(rpcUrl, chainId),
            STABLE: new StablePool(rpcUrl, chainId),
            Buffer: new BufferPool(rpcUrl, chainId),
            GYROE: new GyroECLPPool(rpcUrl, chainId),
            LIQUIDITY_BOOTSTRAPPING: new LiquidityBootstrappingPool(rpcUrl, chainId),
        };
    if (!poolData[poolType]) throw new Error(`getPool: Unsupported pool type: ${poolType}`);

    console.log('Fetching pool data...');
    const immutable = await poolData[poolType].fetchImmutableData(poolAddress, blockNumber);
    const mutable = await poolData[poolType].fetchMutableData(poolAddress, blockNumber);
    console.log('Done');

    return {
        chainId,
        blockNumber,
        poolType,
        poolAddress,
        ...immutable,
        ...mutable,
    };
}
