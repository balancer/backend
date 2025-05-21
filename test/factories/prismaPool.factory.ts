import { Factory } from 'fishery';
import { PrismaPoolAndHookWithDynamic } from '../../prisma/prisma-types';
import { prismaPoolTokenFactory } from './prismaToken.factory';
import { createRandomAddress } from '../utils';
import { Chain, PrismaPoolType } from '@prisma/client';
import { prismaPoolDynamicDataFactory } from './prismaPoolDynamicData.factory';
import { GyroEParams } from '../../modules/sources/subgraphs/balancer-v3-pools/generated/types';
import { ReclammData } from '../../modules/pool/subgraph-mapper';

class PrismaPoolFactory extends Factory<PrismaPoolAndHookWithDynamic> {
    stable(amp?: string) {
        return this.params({ type: PrismaPoolType.STABLE, typeData: { amp: amp ?? '10' } });
    }
    gyroE(gyroEParams: GyroEParams) {
        return this.params({ id: gyroEParams.id, type: PrismaPoolType.GYROE, typeData: { ...gyroEParams } });
    }
    reClamm(reClammData: ReclammData) {
        return this.params({ type: PrismaPoolType.RECLAMM, typeData: { ...reClammData } });
    }
    quantAmm(quantAmmData: {
        firstFourWeightsAndMultipliers: string[];
        secondFourWeightsAndMultipliers: string[];
        maxTradeSizeRatio: string;
        lastUpdateIntervalTime: string;
        lastInterpolationTimePossible: string;
    }) {
        return this.params({ type: PrismaPoolType.QUANT_AMM_WEIGHTED, typeData: { ...quantAmmData } });
    }
}

export const prismaPoolFactory = PrismaPoolFactory.define(({ params }) => {
    const poolAddress = params.address ?? createRandomAddress();
    const hook = params.hook ?? null;
    const liquidityManagement = params.liquidityManagement ?? {
        disableUnbalancedLiquidity: false,
        enableAddLiquidityCustom: false,
        enableDonation: false,
        enableRemoveLiquidityCustom: false,
    };
    const chain = params?.chain || Chain.SEPOLIA;

    return {
        id: poolAddress,
        address: poolAddress,
        symbol: 'TEST-POOL',
        name: 'test pool',
        type: PrismaPoolType.WEIGHTED,
        decimals: 18,
        swapFeeManager: createRandomAddress(),
        pauseManager: createRandomAddress(),
        poolCreator: createRandomAddress(),
        factory: createRandomAddress(),
        chain,
        version: 1,
        protocolVersion: 3,
        typeData: {},
        categories: [],
        createTime: 1708433018,
        dynamicData: prismaPoolDynamicDataFactory.build({ id: poolAddress, chain }),
        tokens: prismaPoolTokenFactory.buildList(2, { chain }),
        hookId: null,
        hook: hook,
        liquidityManagement: liquidityManagement,
    };
});
