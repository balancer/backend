import { Factory } from 'fishery';
import { PrismaPoolAndHookWithDynamic } from '../../prisma/prisma-types';
import { prismaPoolTokenFactory } from './prismaToken.factory';
import { createRandomAddress } from '../utils';
import { Chain, PrismaPoolType } from '@prisma/client';
import { prismaPoolDynamicDataFactory } from './prismaPoolDynamicData.factory';
import { GyroEParams, ReClammParams } from '../../modules/sources/subgraphs/balancer-v3-pools/generated/types';
import { LiquidityBootstrappingPool } from '../testData/read/readTestData';
import { ReclammData } from '../../modules/pool/subgraph-mapper';
import { LBPoolData } from '../../modules/pool/pool-data';
import { formatEther } from 'viem';

class PrismaPoolFactory extends Factory<PrismaPoolAndHookWithDynamic> {
    stable(amp?: string) {
        return this.params({ type: PrismaPoolType.STABLE, typeData: { amp: amp ?? '10' } });
    }
    gyroE(gyroEParams: GyroEParams) {
        return this.params({ id: gyroEParams.id, type: PrismaPoolType.GYROE, typeData: { ...gyroEParams } });
    }
    lbp(lbpParams: LBPoolData & { startWeights: bigint[]; endWeights: bigint[] }) {
        const reserveTokenIndex = 1 - lbpParams.projectTokenIndex;

        return this.params({
            type: PrismaPoolType.LIQUIDITY_BOOTSTRAPPING,
            typeData: {
                projectTokenIndex: lbpParams.projectTokenIndex,
                isProjectTokenSwapInBlocked: lbpParams.isProjectTokenSwapInBlocked,
                //isSwapEnabled: lbpParams.isSwapEnabled,
                //startWeights: lbpParams.startWeights.map((w) => w.toString()), // not provided by API
                //endWeights: lbpParams.endWeights.map((w) => w.toString()), // not provided by API
                projectTokenStartWeight: formatEther(lbpParams.startWeights[lbpParams.projectTokenIndex]),
                projectTokenEndWeight: formatEther(lbpParams.endWeights[lbpParams.projectTokenIndex]),
                reserveTokenStartWeight: formatEther(lbpParams.startWeights[reserveTokenIndex]),
                reserveTokenEndWeight: formatEther(lbpParams.endWeights[reserveTokenIndex]),
                startTime: lbpParams.startTime.toString(),
                endTime: lbpParams.endTime.toString(),
                //currentTimestamp: lbpParams.currentTimestamp.toString(),
            },
        });
    }
    reClamm(reClammData: ReclammData) {
        return this.params({ type: PrismaPoolType.RECLAMM, typeData: { ...reClammData } });
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
