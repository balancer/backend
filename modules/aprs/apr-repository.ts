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
        return prisma.prismaPool.findMany({
            include: {
                dynamicData: true,
                tokens: { include: { token: true, nestedPool: true } },
                staking: {
                    include: { gauge: { include: { rewards: true } }, reliquary: { include: { levels: true } } },
                },
            },
            where: {
                chain,
                ...(poolIds?.length ? { id: { in: poolIds } } : {}),
            },
        });
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
            .filter((item) => {
                const existingItem = existingItemsMap.get(item.id);
                const changed = !existingItem || existingItem.apr !== item.apr;
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
          SET apr = COALESCE(sub.total_apr, 0)
          FROM (
            SELECT
              "poolId",
              "chain",
              SUM("apr") AS total_apr
            FROM "PrismaPoolAprItem"
            WHERE "type" NOT IN (
              'SURPLUS',
              'SURPLUS_30D',
              'SURPLUS_7D',
              'SWAP_FEE_30D',
              'SWAP_FEE_7D',
              'DYNAMIC_SWAP_FEE_24H'
            )
            GROUP BY "poolId", "chain"
          ) AS sub
          WHERE dyn."poolId" = sub."poolId"
            AND dyn."chain" = sub."chain"
            AND dyn."chain" = ${chain}::"Chain"
            AND dyn."poolId" = ANY(${poolIds});
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
