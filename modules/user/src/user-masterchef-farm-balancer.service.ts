import { prisma } from '../../util/prisma-client';
import { masterchefService } from '../../subgraphs/masterchef-subgraph/masterchef.service';

export class UserMasterchefFarmBalancerService {
    public async test() {
        const farms = await prisma.prismaPoolStaking.findMany({ where: { type: 'MASTER_CHEF' } });

        //masterchefService.getFarmUsers({ where: { timestamp } });
    }
}
