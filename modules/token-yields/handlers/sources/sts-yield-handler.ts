import { prisma } from '../../../../prisma/prisma-client';
import { TokenYieldHandler, TokenYieldConfig } from '../../types';

export const stsYieldHandler: TokenYieldHandler = async (config: TokenYieldConfig['sts']) => {
    const stakingData = await prisma.prismaStakedSonicData.findFirstOrThrow();

    return [{ address: config!.token, apr: parseFloat(stakingData.stakingApr) }];
};
