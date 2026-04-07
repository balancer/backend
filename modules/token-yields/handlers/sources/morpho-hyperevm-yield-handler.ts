import MorphoBlueAbi from './abis/morpho-blue';
import MorphoVaultAbi from './abis/morpho-vault';
import MorphoIrmAbi from './abis/morpho-irm';
import { TokenYieldHandler, TokenYieldConfig, TokenApr } from '../../types';
import { Multicaller3Viem } from '../../../web3/multicaller-viem';
import { ZERO_ADDRESS } from '@balancer/sdk';
import { secondsPerYear } from '../../../common/time';

// can be used for felix and hyperbeat

export const morphoHyperevmYieldHandler: TokenYieldHandler = async (
    config: TokenYieldConfig['morphoVaultHyperevm'],
) => {
    const MORPHO_BLUE_ADDRESS = '0x68e37de8d93d3496ae143f2e900490f6280c57cd';
    try {
        const allAprs: TokenApr[] = [];

        const vaultData: {
            address: string;
            supplyQueueLength: number;
            totalAssets: bigint;
            supplyQueue: {
                marketAddress: string;
                totalSupplyShares: bigint;
                totalSupplyAssets: bigint;
                supplyShares: bigint;
                borrowShares: bigint;
                currentAllocation: bigint;
                utilization: number;
                apy: number;
            }[];
        }[] = [];

        // for each of the vaults in the config, get the supply queue length and then the supply queue
        const morphoVaultCaller = new Multicaller3Viem('HYPEREVM', MorphoVaultAbi);
        config!.vaults.forEach((vaultAddress) => {
            morphoVaultCaller.call(`${vaultAddress}.supplyQueueLength`, vaultAddress, 'supplyQueueLength', []);
        });
        const supplyQueueLengthResult = await morphoVaultCaller.execute<{
            [id: string]: { supplyQueueLength: bigint };
        }>();

        // for each vault, get the market id from the supply queue
        config!.vaults.forEach((vaultAddress) => {
            const supplyQueueLength = supplyQueueLengthResult[vaultAddress].supplyQueueLength;
            if (supplyQueueLength === undefined) {
                throw new Error(`Supply queue length for vault ${vaultAddress} is undefined`);
            }
            morphoVaultCaller.call(`${vaultAddress}.totalAssets`, vaultAddress, 'totalAssets', []);
            for (let i = 0n; i < Number(supplyQueueLength); i++) {
                morphoVaultCaller.call(`${vaultAddress}.supplyQueue.${i}`, vaultAddress, 'supplyQueue', [i]);
            }
        });

        const vaultResult = await morphoVaultCaller.execute<{
            [id: string]: { supplyQueue: string[]; totalAssets: bigint }; // marketId
        }>();

        const morphoBlueCaller = new Multicaller3Viem('HYPEREVM', MorphoBlueAbi);
        // for each vault, get the supply data for each market in the supply queue
        config!.vaults.forEach((vaultAddress) => {
            if (vaultResult[vaultAddress].supplyQueue) {
                for (const marketId of vaultResult[vaultAddress].supplyQueue) {
                    if (marketId === undefined) {
                        throw new Error(`Market data for vault ${vaultAddress} is undefined`);
                    }
                    morphoBlueCaller.call(`${vaultAddress}.position.${marketId}`, MORPHO_BLUE_ADDRESS, 'position', [
                        marketId,
                        vaultAddress as `0x${string}`,
                    ]);
                    morphoBlueCaller.call(`${vaultAddress}.market.${marketId}`, MORPHO_BLUE_ADDRESS, 'market', [
                        marketId,
                    ]);
                    morphoBlueCaller.call(
                        `${vaultAddress}.idToMarketParams.${marketId}`,
                        MORPHO_BLUE_ADDRESS,
                        'idToMarketParams',
                        [marketId],
                    );
                }
            }
        });

        const positionResult = await morphoBlueCaller.execute<{
            [id: string]: {
                position: {
                    [marketId: string]: [bigint, bigint, bigint];
                };
                market: {
                    [marketId: string]: [bigint, bigint, bigint, bigint, bigint, bigint];
                };
                idToMarketParams: {
                    [marketId: string]: [
                        loanToken: string,
                        collateralToken: string,
                        oracle: string,
                        irm: string,
                        lltv: bigint,
                    ];
                };
            };
        }>();

        const morphoIrmCaller = new Multicaller3Viem('HYPEREVM', MorphoIrmAbi);
        //for each vault, get the borrow rate for each market in the supply queue
        config!.vaults.forEach((vaultAddress) => {
            if (vaultResult[vaultAddress].supplyQueue) {
                for (const marketId of vaultResult[vaultAddress].supplyQueue) {
                    const market = positionResult[vaultAddress].market[marketId];
                    const [loanToken, collateralToken, oracle, irm, lltv] =
                        positionResult[vaultAddress].idToMarketParams[marketId];
                    if (irm !== ZERO_ADDRESS) {
                        morphoIrmCaller.call(`${vaultAddress}.${marketId}`, irm, 'borrowRateView', [
                            [loanToken, collateralToken, oracle, irm, lltv],
                            market,
                        ]);
                    }
                }
            }
        });

        const borrowRateResult = await morphoIrmCaller.execute<{
            [id: string]: {
                [marketId: string]: bigint;
            };
        }>();

        // create vault data
        for (const vaultAddress of config!.vaults) {
            const supplyQueueLength = supplyQueueLengthResult[`${vaultAddress}`].supplyQueueLength;
            const supplyQueue: {
                marketAddress: string;
                totalSupplyShares: bigint;
                totalSupplyAssets: bigint;
                supplyShares: bigint;
                borrowShares: bigint;
                currentAllocation: bigint;
                utilization: number;
                apy: number;
            }[] = [];

            for (let i = 0n; i < Number(supplyQueueLength); i++) {
                const marketId = vaultResult[vaultAddress].supplyQueue[Number(i)];
                if (marketId === undefined) {
                    throw new Error(`Market data for vault ${vaultAddress} at index ${i} is undefined`);
                }
                const [supplyShares, borrowShares] = positionResult[vaultAddress].position[marketId];
                if (supplyShares === undefined || borrowShares === undefined) {
                    throw new Error(`Position data for vault ${vaultAddress} at market ${marketId} is undefined`);
                }
                const [totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares, ,] =
                    positionResult[vaultAddress].market[marketId];
                if (
                    totalSupplyAssets === undefined ||
                    totalSupplyShares === undefined ||
                    totalBorrowAssets === undefined ||
                    totalBorrowShares === undefined
                ) {
                    throw new Error(`Market data for vault ${vaultAddress} at market ${marketId} is undefined`);
                }

                // if borrow rate is undefined, its idle. meaning utilization and therefore apy are both 0
                const borrowRate = borrowRateResult[vaultAddress]?.[marketId];

                const currentAllocation =
                    totalSupplyShares > 0n ? (supplyShares * totalSupplyAssets) / totalSupplyShares : 0n;
                const utilization =
                    totalSupplyAssets > 0n ? Number((totalBorrowShares * 1000000n) / totalSupplyShares) / 10000 : 0;

                let borrowApy = 0;
                if (borrowRate) {
                    const ratePerSecNum = Number(borrowRate) / 1e18;
                    borrowApy = ratePerSecNum > 0 ? (Math.exp(ratePerSecNum * secondsPerYear) - 1) * 100 : 0;
                }

                const supplyApy = utilization > 0n ? borrowApy * (utilization / 100) : 0; // assuming no fee to protocol

                supplyQueue.push({
                    marketAddress: marketId,
                    totalSupplyShares,
                    totalSupplyAssets,
                    supplyShares,
                    borrowShares,
                    currentAllocation,
                    utilization,
                    apy: supplyApy,
                });
            }

            vaultData.push({
                address: vaultAddress,
                totalAssets: vaultResult[vaultAddress].totalAssets,
                supplyQueueLength: Number(supplyQueueLength),
                supplyQueue,
            });
        }

        // for each vault, calculate the APR

        vaultData.forEach((vault) => {
            const supplyAPY = vault.supplyQueue.reduce((sum, allocation) => {
                const weight = Number((allocation.currentAllocation * 10000n) / vault.totalAssets) / 10000;
                return sum + allocation.apy * (allocation.utilization / 100) * weight;
            }, 0);
            allAprs.push({ address: vault.address.toLowerCase(), apr: supplyAPY / 100 });
        });

        return allAprs;
    } catch (error) {
        throw Error(`morpho vault hyperevm IB APR handler failed: ${(error as Error).message}`);
    }
};
