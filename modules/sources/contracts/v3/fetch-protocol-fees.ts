import { ViemClient } from '../../viem-client';
import vaultV3Abi from '../abis/VaultV3';

export interface ProtocolFees {
    protocolSwapFeePercentage?: bigint;
    protocolYieldFeePercentage?: bigint;
}

export async function fetchProtocolFees(
    vault: string,
    client: ViemClient,
    blockNumber?: bigint,
): Promise<ProtocolFees> {
    const contracts = [
        {
            address: vault as `0x${string}`,
            abi: vaultV3Abi,
            functionName: 'getProtocolSwapFeePercentage',
        },
        {
            address: vault as `0x${string}`,
            abi: vaultV3Abi,
            functionName: 'getProtocolYieldFeePercentage',
        },
    ];

    // @ts-ignore – viem has some issues with the typings when using imported abis
    const results = await client.multicall({ contracts, blockNumber: blockNumber });

    return {
        protocolSwapFeePercentage: results[0].status === 'success' ? results[0].result : undefined,
        protocolYieldFeePercentage: results[1].status === 'success' ? results[1].result : undefined,
    } as ProtocolFees;
}
