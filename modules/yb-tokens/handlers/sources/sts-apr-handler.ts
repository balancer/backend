import { prisma } from '../../../../prisma/prisma-client';
import { YbAprHandler, YbAprConfig } from '../../types';

export const stsAprHandler: YbAprHandler = async (config: YbAprConfig['sts']) => {
    const stakingData = await prisma.prismaStakedSonicData.findFirstOrThrow();

    return [{ address: config!.token, apr: parseFloat(stakingData.stakingApr) }];
};
