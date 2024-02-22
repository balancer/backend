import { PrismaPoolType } from '@prisma/client';
import { ViemClient } from '../types';
import { vaultV3Abi } from './abis/VaultV3';
import { fetchPoolTokenInfo } from './fetch-pool-tokens';

interface PoolInput {
    id: string;
    address: string;
    type: PrismaPoolType;
    version: number;
}

interface PoolData {
    totalSupply: bigint;
    swapFee: bigint;
    protocolSwapFeePercentage: bigint;
    // protocolYieldFeePercentage: bigint;
    // rate?: bigint;
    // amp?: [bigint, boolean, bigint];
    isPoolPaused: boolean;
    isPoolInRecoveryMode: boolean;
}

export async function fetchPoolData(
    vault: string,
    pools: PoolInput[],
    client: ViemClient,
    blockNumber: bigint,
): Promise<Record<string, PoolData>> {
    const totalSupplyContracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'totalSupply',
                args: [pool.address as `0x${string}`],
            } as const,
        ])
        .flat();

    const configContracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getPoolConfig',
                args: [pool.address as `0x${string}`],
            } as const,
        ])
        .flat();

    const protocolSwapFeeContracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getProtocolSwapFeePercentage',
            } as const,
        ])
        .flat();

    // TODO combine into one call
    const totalSupplyResult = await client.multicall({ contracts: totalSupplyContracts, blockNumber: blockNumber });
    const configResult = await client.multicall({ contracts: configContracts, blockNumber: blockNumber });
    const protocolSwapFeeResult = await client.multicall({
        contracts: protocolSwapFeeContracts,
        blockNumber: blockNumber,
    });

    // Parse the results
    const parsedResults: Record<string, PoolData> = {};
    pools.forEach((result, i) => {
        if (
            totalSupplyResult[i].status === 'success' &&
            totalSupplyResult[i].result !== undefined &&
            configResult[i].status === 'success' &&
            configResult[i].result !== undefined &&
            protocolSwapFeeResult[i].status === 'success' &&
            protocolSwapFeeResult[i].result !== undefined
        ) {
            // parse the result here using the abi
            const poolData = {
                totalSupply: totalSupplyResult[i].result!,
                swapFee: configResult[i].result!.staticSwapFeePercentage,
                protocolSwapFeePercentage: 0n, // TODO can this be added to config?
                isPoolPaused: configResult[i].result!.isPoolPaused,
                isPoolInRecoveryMode: configResult[i].result!.isPoolInRecoveryMode,
            } as PoolData;

            parsedResults[result.id] = poolData;
        }
        // Handle the error
    });
    return parsedResults;
}
