import { Prisma, Chain, PrismaPoolAprItem } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import _ from 'lodash';

const aprsInclude = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        tokens: { include: { token: true, nestedPool: true } },
        staking: { include: { gauge: { include: { rewards: true } }, reliquary: { include: { levels: true } } } },
    },
});

export type PoolAPRData = Prisma.PrismaPoolGetPayload<typeof aprsInclude>;

export class AprRepository {
    /**
     * Get pools with data needed for APR calculations
     */
    async getPoolsForAprCalculation(chain: Chain, poolIds?: string[]): Promise<PoolAPRData[]> {
        const [dbPools, dynamicData, pts] = await Promise.all([
            prisma.prismaPool.findMany({
                where: { chain, ...(poolIds ? { id: { in: poolIds } } : {}) },
                include: {
                    staking: {
                        include: {
                            gauge: {
                                where: {
                                    status: {
                                        not: 'KILLED',
                                    },
                                },
                                include: { rewards: true },
                            },
                            reliquary: { include: { levels: true } },
                        },
                    },
                },
            }),
            prisma.prismaPoolDynamicData
                .findMany({ where: { chain, ...(poolIds ? { id: { in: poolIds } } : {}) } })
                .then((records) => _.keyBy(records, 'id') as Record<string, (typeof records)[0]>),
            prisma.prismaPoolToken
                .findMany({
                    where: {
                        chain,
                        ...(poolIds ? { poolId: { in: poolIds } } : {}),
                    },
                    include: {
                        token: true,
                        nestedPool: true,
                    },
                })
                .then((records) => _.groupBy(records, 'poolId') as Record<string, typeof records>),
        ]);

        const pools = dbPools
            .map((pool) => ({
                ...pool,
                dynamicData: dynamicData[pool.id],
                tokens: pts[pool.id],
            }))
            // Filter needed for test pools on Sepolia
            .filter((pool) => pool.dynamicData);

        return pools;
    }

    /**
     * Save APR items to the database
     * Only updates when the APR value has changed
     * @returns changed poolIDs
     */
    async savePoolAprItems(
        chain: Chain,
        newAprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[],
        poolIds?: string[],
    ): Promise<string[]> {
        if (newAprItems.length === 0) return [];

        const changedPoolIds = new Set<string>();

        // Fetch all existing APR items by poolId
        const existingItems = await prisma.prismaPoolAprItem.findMany({
            where: {
                chain: chain,
                ...(poolIds ? { poolId: { in: poolIds } } : {}),
            },
        });

        // Remove items that are not in newAprItems anymore
        const itemsToRemove = existingItems.filter(
            (existingItem) => !newAprItems.find((newAprItem) => newAprItem.id === existingItem.id),
        );

        if (itemsToRemove.length > 0) {
            await prisma.prismaPoolAprItem.deleteMany({
                where: {
                    id: { in: itemsToRemove.map((item) => item.id) },
                    chain: chain,
                },
            });
            [...new Set(itemsToRemove.map((i) => i.poolId))].forEach((poolId) => changedPoolIds.add(poolId));
        }

        // Create a lookup map for quick access
        const existingItemsMap = new Map(existingItems.map((item) => [item.id, item]));

        // Only create operations for items that don't exist or have changed
        const operations = newAprItems
            .map((item) => ({
                ...item,
                apr: Math.abs(item.apr) < 0.0001 ? 0 : item.apr, // round to zero when less that 0.01%
            }))
            .filter((item) => {
                const existingItem = existingItemsMap.get(item.id);

                if (!existingItem) {
                    changedPoolIds.add(item.poolId);
                    return true;
                }

                const changed =
                    Math.abs(existingItem.apr - item.apr) > 0.0001 || (existingItem.apr !== 0 && item.apr === 0);

                if (changed) {
                    changedPoolIds.add(item.poolId);
                }

                return changed;
            })
            .map((item) =>
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: item.id, chain: item.chain } },
                    create: item,
                    update: { apr: item.apr },
                }),
            );

        if (operations.length > 0) {
            await prismaBulkExecuteOperations(operations);
            console.log(`Updated ${operations.length} APR items`);
        }

        return [...changedPoolIds];
    }

    /**
     * Update total APR values in pool dynamic data
     * Only updates when the APR value has changed
     * @returns Number of pools that were actually updated
     */
    async updatePoolTotalApr(chain: Chain, poolIds: string[]): Promise<boolean> {
        if (poolIds.length === 0) return true;

        await prisma.$executeRaw`
          UPDATE "PrismaPoolDynamicData" AS dyn
          SET apr = COALESCE(
            (
              SELECT SUM(item."apr")
              FROM "PrismaPoolAprItem" AS item
              WHERE item."poolId" = dyn."poolId"
                AND item."chain"  = dyn."chain"
                AND item."type" NOT IN (
                  'SURPLUS',
                  'SURPLUS_30D',
                  'SURPLUS_7D',
                  'SWAP_FEE_30D',
                  'SWAP_FEE_7D',
                  'DYNAMIC_SWAP_FEE_24H'
                )
            ),
            0
          );
        `;

        return true;
    }

    /**
     * Delete all APR items for a chain
     */
    async deleteAllPoolAprItems(chain: Chain): Promise<void> {
        await prisma.prismaPoolAprItem.deleteMany({ where: { chain } });
    }
}
