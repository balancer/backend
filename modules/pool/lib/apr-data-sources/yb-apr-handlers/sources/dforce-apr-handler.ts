import { abi } from './abis/dforce-susx';
import { createPublicClient, http } from 'viem';
import config from '../../../../../../config';
import { arbitrum } from 'viem/chains';
import { AprHandler } from '../types';
import { YbAprConfig } from '../../../../../network/apr-config-types';

// Initialize the client for Arbitrum network
const client = createPublicClient({
    chain: arbitrum,
    transport: http(config.ARBITRUM.rpcUrl),
});

const functionName: 'currentAPY' = 'currentAPY';
const isIbYield = true;

export class DForce implements AprHandler {
    constructor(private config: YbAprConfig['dforce']) {}

    async getAprs() {
        try {
            const result = await client.readContract({
                address: this.config!.token as `0x${string}`,
                abi,
                functionName,
            });

            const [apyRaw] = result;

            // Calculate the APY based on the provided formula
            const apr = Number(apyRaw) / 1e27 - 1;

            return {
                [this.config!.token.toLowerCase()]: {
                    apr,
                    isIbYield,
                },
            };
        } catch (error) {
            console.error('Error fetching APY:', error);
            return {
                [this.config!.token.toLowerCase()]: {
                    apr: 0,
                    isIbYield,
                },
            };
        }
    }
}
