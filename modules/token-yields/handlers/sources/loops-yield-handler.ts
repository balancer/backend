import { prisma } from '../../../../prisma/prisma-client';
import { TokenYieldHandler, TokenYieldConfig } from '../../types';

export const loopsYieldHandler: TokenYieldHandler = async (config: TokenYieldConfig['loops']) => {
    const stakingData = await prisma.prismaLoopsData.findFirstOrThrow();

    return [{ address: config!.token, apr: stakingData.totalApr }];
};
