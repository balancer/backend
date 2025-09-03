import { abi } from './abis/hypurrfi-market';
import { YbAprHandler, YbAprConfig, TokenApr } from '../../types';
import { secondsPerYear } from '../../../common/time';
import { getViemClient } from '../../../sources/viem-client';

export const hypurrFi: YbAprHandler = async (config: YbAprConfig['hypurrfi']) => {
    try {
        const client = getViemClient('HYPEREVM');
        const allAprs: TokenApr[] = [];

        for (const market of config!.markets) {
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

            allAprs.push({ address: market.toLowerCase(), apr: lendAPY / 100 });
        }
        return allAprs;
    } catch (error) {
        throw Error(`hypurrfi IB APR hanlder failed: ${(error as Error).message}`);
    }
};
