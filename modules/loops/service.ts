import { prisma } from '../../prisma/prisma-client';
import { fetchLoopsData } from './onchain-data';
import { calculateLoopsApr } from './apr-data';
import { GqlLoopsData } from '../../apps/api/gql/generated-schema';
import config from '../../config';
import { chainIdToChain } from '../network/chain-id-to-chain';

export class LoopsService {
    async fetchAndStoreLoopsData(chainId: string): Promise<void> {
        const loopsAddress = config[chainIdToChain[chainId]].loops?.address;
        if (!loopsAddress) {
            return;
        }

        const onchainLoopsData = await fetchLoopsData(loopsAddress);
        const loopsApr = await calculateLoopsApr(onchainLoopsData);

        await prisma.prismaLoopsData.upsert({
            where: { id: loopsAddress.toLowerCase() },
            create: {
                id: loopsAddress.toLowerCase(),
                nav: onchainLoopsData.nav,
                actualSupply: onchainLoopsData.actualSupply,
                rate: onchainLoopsData.getRate,
                collateralAmount: onchainLoopsData.collateralAmount,
                collateralAmountInEth: onchainLoopsData.collateralAmountInEth,
                debtAmount: onchainLoopsData.debtAmount,
                healthFactor: onchainLoopsData.healthFactor,
                stsAaveMarketCap: onchainLoopsData.stsAaveMarketCap,
                stsAaveMarketSupply: onchainLoopsData.stsAaveMarketSupply,
                stsAaveMarketMaxLTV: onchainLoopsData.stsAaveMarketMaxLTV,
                totalApr: loopsApr,
                loanToValue: '0',
                leverage: 0,
                meritApr: 0,
                borrowApr: 0,
            },
            update: {
                nav: onchainLoopsData.nav,
                actualSupply: onchainLoopsData.actualSupply,
                rate: onchainLoopsData.getRate,
                collateralAmount: onchainLoopsData.collateralAmount,
                collateralAmountInEth: onchainLoopsData.collateralAmountInEth,
                debtAmount: onchainLoopsData.debtAmount,
                healthFactor: onchainLoopsData.healthFactor,
                stsAaveMarketCap: onchainLoopsData.stsAaveMarketCap,
                stsAaveMarketSupply: onchainLoopsData.stsAaveMarketSupply,
                stsAaveMarketMaxLTV: onchainLoopsData.stsAaveMarketMaxLTV,
                totalApr: loopsApr,
                loanToValue: '0',
                leverage: 0,
                meritApr: 0,
                borrowApr: 0,
            },
        });
    }

    async getLoopsData(): Promise<GqlLoopsData> {
        const dbData = await prisma.prismaLoopsData.findFirstOrThrow();
        return {
            nav: dbData.nav,
            actualSupply: dbData.actualSupply,
            rate: dbData.rate,
            collateralAmount: dbData.collateralAmount,
            collateralAmountInEth: dbData.collateralAmountInEth,
            debtAmount: dbData.debtAmount,
            healthFactor: dbData.healthFactor,
            stSAaveMarketCap: dbData.stsAaveMarketCap,
            stSAaveMarketSupply: dbData.stsAaveMarketSupply,
            stSAaveMarketMaxLTV: dbData.stsAaveMarketMaxLTV,
            apr: dbData.totalApr,
            ltv: dbData.loanToValue,
            leverage: dbData.leverage,
            aaveMeritApr: dbData.meritApr,
            aaveSBorrowApr: dbData.borrowApr,
            sonicPointsMultiplier: '1', // TODO: fetch from config
        };
    }
}
