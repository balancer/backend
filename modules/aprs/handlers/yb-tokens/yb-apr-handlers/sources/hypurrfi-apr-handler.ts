import { abi } from './abis/hypurrfi-market';
import { createPublicClient, http } from 'viem';
import config from '../../../../../../config';
import { arbitrum } from 'viem/chains';
import { YbAprHandler } from '../types';
import { YbAprConfig } from '../../../../../network/apr-config-types';
import { secondsPerYear } from '../../../../../common/time';
import { getViemClient } from '../../../../../sources/viem-client';

// Initialize the client for Arbitrum network
const client = getViemClient('HYPEREVM');
const isIbYield = true;

export class HypurrFi implements YbAprHandler {
    constructor(private config: YbAprConfig['hypurrfi']) {}

    async getAprs() {
        try {
            const allAprs: { [tokenAddress: string]: { apr: number; isIbYield: boolean } } = {};

            for (const market of this.config!) {
                // Fetch the current APY for the market
                const [, , , { lastBlock, feeToProtocolRate, lastTimestamp, ratePerSec, fullUtilizationRate }] =
                    await client.readContract({
                        address: market as `0x${string}`,
                        abi,
                        functionName: 'previewAddInterest',
                    });

                const [totalAssetAmount, totalAssetShares, , totalBorrowShares] = await client.readContract({
                    address: market as `0x${string}`,
                    abi,
                    functionName: 'getPairAccounting',
                });

                const utilization =
                    totalAssetAmount > 0n ? Number((totalBorrowShares * 1000000n) / totalAssetShares) / 10000 : 0;

                // Calculate APY using rate info
                const ratePerSecNum = Number(ratePerSec) / 1e18;
                // feeToProtocolRate is 1e5 precision
                const feeToProtocolRateNum = Number(feeToProtocolRate) / 1e5;

                // Compute Borrow APY using continuous compounding formula
                const borrowAPY = ratePerSecNum > 0 ? (Math.exp(ratePerSecNum * secondsPerYear) - 1) * 100 : 0;

                const lendAPY = borrowAPY * (utilization / 100) * (1 - feeToProtocolRateNum);

                allAprs[market.toLowerCase()] = {
                    apr: lendAPY,
                    isIbYield,
                };
            }
            return allAprs;
        } catch (error) {
            throw Error(`dforce IB APR hanlder failed: ${(error as Error).message}`);
        }
    }
}
