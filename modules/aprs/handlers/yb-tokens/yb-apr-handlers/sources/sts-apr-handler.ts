import { YbAprConfig } from '../../../../../network/apr-config-types';
import { prisma } from '../../../../../../prisma/prisma-client';
import { YbAprHandler } from '../types';

export class StsAprHandler implements YbAprHandler {
    constructor(private config: YbAprConfig['sts']) {}

    async getAprs() {
        const stakingData = await prisma.prismaStakedSonicData.findFirstOrThrow();

        return {
            [this.config!.token]: { apr: parseFloat(stakingData.stakingApr), isIbYield: true },
        };
    }
}
