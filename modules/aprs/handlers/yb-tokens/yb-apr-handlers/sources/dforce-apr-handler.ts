import { abi } from './abis/dforce-susx';
import { createPublicClient, http } from 'viem';
import cnfg from '../../../../../../config';
import { arbitrum } from 'viem/chains';
import { YbAprHandler } from '../../types';

// Initialize the client for Arbitrum network
const functionName: 'currentAPY' = 'currentAPY';

export const dForce: YbAprHandler = async (config = cnfg.ARBITRUM.aprHandlers.ybAprHandler?.dforce) => {
    try {
        const client = createPublicClient({
            chain: arbitrum,
            transport: http(cnfg.ARBITRUM.rpcUrl),
        });

        const result = await client.readContract({
            address: config!.token as `0x${string}`,
            abi,
            functionName,
        });

        const [apyRaw] = result;

        // Calculate the APY based on the provided formula
        const apr = Number(apyRaw) / 1e27 - 1;

        return [
            {
                address: config!.token.toLowerCase(),
                apr,
            },
        ];
    } catch (error) {
        throw Error(`dforce IB APR hanlder failed: ${(error as Error).message}`);
    }
};
