import { mockDeep } from 'vitest-mock-extended';
import { prisma } from '../../prisma/prisma-client';
import { PrismaPoolStakingGauge } from '.prisma/client';

export const prismaMock = mockDeep<typeof prisma>();

export const defaultStakingGaugeId = '0x79ef6103a513951a3b25743db509e267685726b7';
export const defaultStakingGauge = { id: defaultStakingGaugeId } as unknown as PrismaPoolStakingGauge;

prismaMock.prismaPoolStakingGauge.findFirstOrThrow.mockResolvedValue(defaultStakingGauge);
