import { prisma } from '../../prisma/prisma-client';
import { fetchAaveData, fetchLoopsData } from './onchain-data';
import { calculateLoopsApr } from './apr-data';
import { GqlLoopsData } from '../../apps/api/gql/generated-schema';
import config from '../../config';
import { Chain } from '@prisma/client';

export class LoopsService {
    async fetchAndStoreLoopsData(chain: Chain): Promise<void> {
        const loopsAddress = config[chain].loops?.address;
        const aaveDataProvider = config[chain].loops?.aavePoolDataProvider;
        const aavePoolAddressesProvider = config[chain].loops?.aavePoolAddressesProvider;
        const stsAddress = config[chain].sts?.address;
        const wsAddress = config[chain].weth.address;
        if (!loopsAddress || !aaveDataProvider || !stsAddress || !wsAddress || !aavePoolAddressesProvider) {
            return;
        }

        const onchainLoopsData = await fetchLoopsData(loopsAddress);
        const onchainAaveData = await fetchAaveData(aaveDataProvider, aavePoolAddressesProvider, stsAddress, wsAddress);
        const loopsApr = await calculateLoopsApr(onchainLoopsData, onchainAaveData, stsAddress);

        const sonicPrice = await prisma.prismaTokenCurrentPrice.findUniqueOrThrow({
            where: { tokenAddress_chain: { tokenAddress: wsAddress, chain } },
        });
        const tvl = parseFloat(onchainLoopsData.nav) * sonicPrice.price;

        await prisma.prismaLoopsData.upsert({
            where: { id: loopsAddress.toLowerCase() },
            create: {
                id: loopsAddress.toLowerCase(),
                nav: onchainLoopsData.nav,
                tvl: tvl.toString(),
                actualSupply: onchainLoopsData.actualSupply,
                rate: onchainLoopsData.rate,
                collateralAmount: onchainLoopsData.collateralAmount,
                collateralAmountInEth: onchainLoopsData.collateralAmountInEth,
                debtAmount: onchainLoopsData.debtAmount,
                healthFactor: onchainLoopsData.healthFactor,
                totalApr: loopsApr,
                leverage: parseFloat(onchainLoopsData.collateralAmountInEth) / parseFloat(onchainLoopsData.nav),
                stsAaveMarketSupplyCap: onchainAaveData.aaveStSMarketSupplyCap,
                stsAaveMarketSupply: onchainAaveData.aaveStSMarketAvailableLiquidity,
                wSAaveMarketSupplyCap: onchainAaveData.aaveWSMarketSupplyCap,
                wSAaveMarketBorrowed: onchainAaveData.aaveWSTotalScaledVariableDebt,
                wSAaveMarketBorrowCap: onchainAaveData.aaveWSMarketBorrowCap,
            },
            update: {
                nav: onchainLoopsData.nav,
                tvl: tvl.toString(),
                actualSupply: onchainLoopsData.actualSupply,
                rate: onchainLoopsData.rate,
                collateralAmount: onchainLoopsData.collateralAmount,
                collateralAmountInEth: onchainLoopsData.collateralAmountInEth,
                debtAmount: onchainLoopsData.debtAmount,
                healthFactor: onchainLoopsData.healthFactor,
                stsAaveMarketSupplyCap: onchainAaveData.aaveStSMarketSupplyCap,
                stsAaveMarketSupply: onchainAaveData.aaveStSMarketAvailableLiquidity,
                totalApr: loopsApr,
                leverage: parseFloat(onchainLoopsData.collateralAmountInEth) / parseFloat(onchainLoopsData.nav),
                wSAaveMarketSupplyCap: onchainAaveData.aaveWSMarketSupplyCap,
                wSAaveMarketBorrowed: onchainAaveData.aaveWSTotalScaledVariableDebt,
                wSAaveMarketBorrowCap: onchainAaveData.aaveWSMarketBorrowCap,
            },
        });
    }

    async getLoopsData(): Promise<GqlLoopsData> {
        const dbData = await prisma.prismaLoopsData.findFirstOrThrow();
        return {
            nav: dbData.nav,
            tvl: dbData.tvl,
            actualSupply: dbData.actualSupply,
            rate: dbData.rate,
            collateralAmount: dbData.collateralAmount,
            collateralAmountInEth: dbData.collateralAmountInEth,
            debtAmount: dbData.debtAmount,
            healthFactor: dbData.healthFactor,
            targetHealthFactor: '1.3', // hardcoded for now, we can store it in the db later if needed
            stSAaveMarketSupplyCap: dbData.stsAaveMarketSupplyCap,
            stSAaveMarketSupply: dbData.stsAaveMarketSupply,
            apr: dbData.totalApr,
            leverage: dbData.leverage,
            sonicPointsMultiplier: `${(parseFloat(dbData.collateralAmount) / parseFloat(dbData.actualSupply)) * 12}`,
        };
    }
}
