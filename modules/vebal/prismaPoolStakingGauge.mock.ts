import { mockDeep } from 'vitest-mock-extended';
import { prisma as prismaClient } from '../../prisma/prisma-client';
import { PrismaPoolStakingGauge } from '.prisma/client';
import { Chain } from '@prisma/client';

export function aPrismaPoolStakingGauge(...options: Partial<PrismaPoolStakingGauge>[]): PrismaPoolStakingGauge {
    const defaultGauge: PrismaPoolStakingGauge = {
        id: '0x79ef6103a513951a3b25743db509e267685726b7',
        stakingId: '0x79ef6103a513951a3b25743db509e267685726b7',
        gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7',
        chain: 'MAINNET' as Chain,
        status: 'ACTIVE',
        version: 1,
        workingSupply: '0',
        totalSupply: '0',
    };
    return Object.assign({}, defaultGauge, ...options);
}

export const prismaMock = mockDeep<typeof prismaClient>();

export const defaultStakingGaugeId = '0x79ef6103a513951a3b25743db509e267685726b7';
export const defaultStakingGauge = aPrismaPoolStakingGauge({ id: defaultStakingGaugeId });

prismaMock.prismaPoolStakingGauge.findFirst.mockResolvedValue(defaultStakingGauge);
