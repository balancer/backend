import { prisma } from '../../util/prisma-client';
import { prismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { PoolAprService } from '../pool-types';

export class PoolAprUpdaterService {
    constructor(private readonly aprServices: PoolAprService[]) {}

    public async updatePoolAprs() {
        const pools = await prisma.prismaPool.findMany(prismaPoolWithExpandedNesting);

        for (const aprService of this.aprServices) {
            await aprService.updateAprForPools(pools);
        }
    }
}
