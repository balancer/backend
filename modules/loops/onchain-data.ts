import { formatEther, formatUnits } from 'viem';
import { Multicaller3Viem } from '../web3/multicaller-viem';
import aavePoolDataProviderAbi from './abi/aave-ui-pool-data-provider';
import loopsAbi from './abi/loops-abi';
import { getViemClient } from '../sources/viem-client';

export type OnchainLoopsData = {
    nav: string;
    actualSupply: string;
    rate: string;
    collateralAmount: string;
    collateralAmountInEth: string;
    debtAmount: string;
    healthFactor: string;
};

export type OnchainAaveData = {
    liquidityRateLst: string;
    variableBorrowRateWS: string;
    aaveStSMarketSupplyCap: string;
    aaveWSMarketSupplyCap: string;
    aaveWSMarketBorrowCap: string;
    aaveStSMarketAvailableLiquidity: string;
    aaveWSMarketAvailableLiquidity: string;
    aaveStSTotalScaledVariableDebt: string;
    aaveWSTotalScaledVariableDebt: string;
};

export async function fetchLoopsData(loopsAddress: string): Promise<OnchainLoopsData> {
    const multicaller = new Multicaller3Viem('SONIC', loopsAbi);

    multicaller.call('nav', loopsAddress, 'totalAssets', []);
    multicaller.call('actualSupply', loopsAddress, 'actualSupply', []);
    multicaller.call('rate', loopsAddress, 'getRate', []);
    multicaller.call('collateralAmount', loopsAddress, 'getAaveLstCollateralAmount', []);
    multicaller.call('collateralAmountInEth', loopsAddress, 'getAaveLstCollateralAmountInEth', []);
    multicaller.call('debtAmount', loopsAddress, 'getAaveWethDebtAmount', []);
    multicaller.call('healthFactor', loopsAddress, 'getHealthFactor', []);

    const loopsResults = (await multicaller.execute()) as {
        nav: bigint;
        actualSupply: bigint;
        rate: bigint;
        collateralAmount: bigint;
        collateralAmountInEth: bigint;
        debtAmount: bigint;
        healthFactor: bigint;
    };

    return {
        nav: formatEther(loopsResults.nav),
        actualSupply: formatEther(loopsResults.actualSupply),
        rate: formatEther(loopsResults.rate),
        collateralAmount: formatEther(loopsResults.collateralAmount),
        collateralAmountInEth: formatEther(loopsResults.collateralAmountInEth),
        debtAmount: formatEther(loopsResults.debtAmount),
        healthFactor: formatEther(loopsResults.healthFactor),
    };
}

export async function fetchAaveData(
    aavePoolDataProvider: string,
    poolAddressesProvider: string,
    stsAddress: string,
    wsAddress: string,
) {
    const client = getViemClient('SONIC');
    const aaveData = await client
        .readContract({
            address: aavePoolDataProvider as `0x${string}`,
            abi: aavePoolDataProviderAbi,
            functionName: 'getReservesData',
            args: [poolAddressesProvider as `0x${string}`],
        })
        .then((list) => new Map(list[0].map((item) => [item.underlyingAsset.toLowerCase(), item])));

    const aaveOnChainData: OnchainAaveData = {
        liquidityRateLst: formatEther(aaveData.get(stsAddress.toLowerCase())?.liquidityRate ?? 0n),
        variableBorrowRateWS: formatUnits(aaveData.get(wsAddress.toLowerCase())?.variableBorrowRate ?? 0n, 27),
        aaveStSMarketSupplyCap: aaveData.get(stsAddress.toLowerCase())?.supplyCap.toString() ?? '0',
        aaveWSMarketSupplyCap: aaveData.get(wsAddress.toLowerCase())?.supplyCap.toString() ?? '0',
        aaveWSMarketBorrowCap: aaveData.get(wsAddress.toLowerCase())?.borrowCap.toString() ?? '0',
        aaveStSMarketAvailableLiquidity: formatEther(aaveData.get(stsAddress.toLowerCase())?.availableLiquidity ?? 0n),
        aaveWSTotalScaledVariableDebt: formatEther(
            aaveData.get(wsAddress.toLowerCase())?.totalScaledVariableDebt ?? 0n,
        ),
        aaveStSTotalScaledVariableDebt: formatEther(
            aaveData.get(stsAddress.toLowerCase())?.totalScaledVariableDebt ?? 0n,
        ),
        aaveWSMarketAvailableLiquidity: formatEther(aaveData.get(wsAddress.toLowerCase())?.availableLiquidity ?? 0n),
    };

    return aaveOnChainData;
}
