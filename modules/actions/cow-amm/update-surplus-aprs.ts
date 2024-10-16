import { PrismaPool, PrismaPoolAprType, PrismaPoolDynamicData } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

export const updateSurplusAPRs = async () => {
    const pools = await prisma.prismaPool.findMany({
        where: {
            type: 'COW_AMM',
        },
        include: {
            dynamicData: true,
        },
    });

    // Filter out pool with no dynamic data
    const surpluses = pools.filter(
        (pool): pool is PrismaPool & { dynamicData: PrismaPoolDynamicData } => pool.dynamicData?.surplus24h !== null,
    );

    const data = surpluses.map((pool) => ({
        id: `${pool.id}-surplus`,
        type: PrismaPoolAprType.SURPLUS,
        title: `Surplus APR`,
        chain: pool.chain,
        poolId: pool.id,
        apr:
            pool.dynamicData.surplus24h <= 0 || pool.dynamicData.totalLiquidity === 0
                ? 0
                : (pool.dynamicData.surplus24h * 365) / pool.dynamicData.totalLiquidity,
    }));

    await prisma.$transaction([
        prisma.prismaPoolAprItem.deleteMany({
            where: {
                type: PrismaPoolAprType.SURPLUS,
            },
        }),
        prisma.prismaPoolAprItem.createMany({
            data,
        }),
    ]);

    return data.map(({ id, apr }) => ({ id, apr }));
};
