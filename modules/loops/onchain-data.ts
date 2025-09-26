import { Multicaller3Viem } from '../web3/multicaller-viem';
import aaveDataProvider from './abi/aave-data-provider';
import loopsAbi from './abi/loops-abi';

export type OnchainLoopsData = {
    nav: string;
    actualSupply: string;
    getRate: string;
    collateralAmount: string;
    collateralAmountInEth: string;
    debtAmount: string;
    healthFactor: string;
    stsAaveMarketCap: string;
    stsAaveMarketSupply: string;
    stsAaveMarketMaxLTV: string;
};

export async function fetchLoopsData(loopsAddress: string): Promise<OnchainLoopsData> {
    // const multicaller = new Multicaller3Viem('SONIC', loopsAbi);

    // multicaller.call('totalAssets', loopsAddress, 'totalAssets', []);
    // multicaller.call('actualSupply', loopsAddress, 'actualSupply', []);
    // multicaller.call('getRate', loopsAddress, 'getRate', []);
    // multicaller.call('collateralAmount', loopsAddress, 'collateralAmount', []);
    // multicaller.call('collateralAmountInEth', loopsAddress, 'collateralAmountInEth', []);
    // multicaller.call('debtAmount', loopsAddress, 'debtAmount', []);
    // multicaller.call('healthFactor', loopsAddress, 'healthFactor', []);

    // const loopsResults = await multicaller.execute<OnchainLoopsData>();
    // if (loopsResults) {
    //     return loopsResults;
    // }

    // const aaveMulticaller = new Multicaller3Viem('SONIC', aaveDataProvider);
    // aaveMulticaller.call('stsReserveData', '0xc0a344397cfa89dF1e1d3e4fb330834D789cF2CD', 'getReserveData', [
    //     '0xE5DA20F15420aD15DE0fa650600aFc998bbE3955',
    // ]);
    // aaveMulticaller.call('wSReserveData', '0xc0a344397cfa89dF1e1d3e4fb330834D789cF2CD', 'getReserveData', [
    //     '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
    // ]);

    return {
        nav: '10',
        actualSupply: '20',
        getRate: '1.02',
        collateralAmount: '20',
        collateralAmountInEth: '20.6',
        debtAmount: '10',
        healthFactor: '1.5',
        stsAaveMarketCap: '2000',
        stsAaveMarketSupply: '1800',
        stsAaveMarketMaxLTV: '0.87',
    };
}
