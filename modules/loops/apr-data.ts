import { prisma } from '../../prisma/prisma-client';
import { OnchainAaveData, OnchainLoopsData } from './onchain-data';

export async function calculateLoopsApr(
    onchainLoopsData: OnchainLoopsData,
    onchainAaveData: OnchainAaveData,
    stSAddress: string,
): Promise<number> {
    const stSApr = await prisma.prismaTokenYield.findFirstOrThrow({
        where: { address: stSAddress, chain: 'SONIC' },
    });

    const meritAprResponse = await fetch('https://apps.aavechan.com/api/aave-all-incentives?chainId=146');
    const meritAprData = (await meritAprResponse.json()) as {
        [marketName: string]: {
            supplyIncentives: {
                apr: number;
            }[];
        };
    };

    const meritApr = meritAprData['stS'].supplyIncentives.reduce((acc, curr) => acc + curr.apr, 0) / 100;

    console.log('stS APR:', stSApr.apr);
    console.log('Merit APR:', meritApr);
    console.log('Aave WS variable borrow APR:', onchainAaveData.variableBorrowRateWS);

    // calculate loops APR as (stS APR * collateralAmount + aave merit incentive apr * debtAmount - Aave S borrow APR * debtAmount) / actualSupply
    const loopsApr =
        (stSApr.apr * parseFloat(onchainLoopsData.collateralAmount) +
            meritApr * parseFloat(onchainLoopsData.debtAmount) -
            parseFloat(onchainAaveData.variableBorrowRateWS) * parseFloat(onchainLoopsData.debtAmount)) /
        parseFloat(onchainLoopsData.actualSupply);

    return loopsApr;
}
