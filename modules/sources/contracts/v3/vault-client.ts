import { ViemClient } from '../../viem-client';
import { OnchainPoolData, fetchPoolData } from './fetch-pool-data';
import { ProtocolFees, fetchProtocolFees } from './fetch-protocol-fees';

export interface VaultClient {
    fetchPoolData: (pools: string[], blockNumber?: bigint) => Promise<{ [address: string]: OnchainPoolData }>;
    fetchProtocolFees: (blockNumber?: bigint) => Promise<ProtocolFees>;
}

export const getVaultClient = (viemClient: ViemClient, vaultAddress: string): VaultClient => {
    return {
        fetchPoolData: async (pools: string[], blockNumber?: bigint) =>
            fetchPoolData(vaultAddress, pools, viemClient, blockNumber),
        fetchProtocolFees: async (blockNumber?: bigint) => fetchProtocolFees(vaultAddress, viemClient, blockNumber),
    };
};
