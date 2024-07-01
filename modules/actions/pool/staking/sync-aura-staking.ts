import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { AuraSubgraphService } from '../../../sources/subgraphs/aura/aura.service';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';

export const syncAuraStakingForPools = async (
    chain: Chain,
    auraSubgraphService: AuraSubgraphService,
): Promise<void> => {
    const auraGauges = await auraSubgraphService.getAllPools([chain]);
    const pools = await prisma.prismaPool.findMany({
        where: {
            chain: chain,
            address: { in: auraGauges.map((gauge) => gauge.lpToken.address) },
        },
        include: { staking: true },
    });

    const operations: any[] = [];

    for (const auraGauge of auraGauges) {
        const pool = pools.find((pool) => pool.address === auraGauge.lpToken.address);

        if (!pool) {
            continue;
        }

        const stakingId = auraGauge.address;

        const dbStaking = pool.staking.find((staking) => staking.chain === chain && staking.id === stakingId);

        if (!dbStaking) {
            operations.push(
                prisma.prismaPoolStaking.upsert({
                    where: { id_chain: { id: stakingId, chain: chain } },
                    create: {
                        id: stakingId,
                        chain: chain,
                        poolId: pool.id,
                        type: 'AURA',
                        address: auraGauge.address,
                    },
                    update: {},
                }),
            );
        }

        const apr = auraGauge.aprs.total / 100;

        operations.push(
            prisma.prismaPoolStakingAura.upsert({
                where: { id_chain: { id: stakingId, chain: chain } },
                create: {
                    id: stakingId,
                    chain: chain,
                    stakingId: stakingId,
                    apr,
                    auraPoolAddress: auraGauge.address,
                    auraPoolId: auraGauge.id,
                    isShutdown: auraGauge.isShutdown,
                },
                update: { apr },
            }),
        );
    }

    await prismaBulkExecuteOperations(operations, true);
};

export const deleteAuraStakingForAllPools = async (stakingTypes: PrismaPoolStakingType[], chain: Chain) => {
    if (stakingTypes.includes('AURA')) {
        await prisma.prismaUserStakedBalance.deleteMany({
            where: { staking: { type: 'AURA' }, chain: chain },
        });
        await prisma.prismaPoolStakingAura.deleteMany({ where: { chain: chain } });
        await prisma.prismaPoolStaking.deleteMany({
            where: { type: 'AURA', chain: chain },
        });
    }
};
