import { Chain } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';

export const blockNumbers = (db = prisma) => ({
    /**
     * Get the block number for a given timestamp
     *
     * @param chain
     * @param timestamp
     * @returns
     */
    async getBlock(chain: Chain, timestamp: number) {
        if (timestamp < 0 || timestamp > Date.now() / 1000 + 10 * 365 * 24 * 60 * 60) {
            throw new Error(`Invalid timestamp ${timestamp}`);
        }

        const [event] = await db.$queryRawUnsafe<{ blockNumber: number }[]>(`
            SELECT "blockNumber"
            FROM "PartitionedPoolEvent"
            WHERE chain = '${chain}'
            AND "blockTimestamp" <= ${timestamp}::integer
            ORDER BY "blockTimestamp" DESC
            LIMIT 1;
        `);

        return event?.blockNumber;
    },
    /**
     * Block numbers for the last n days closest to 00:00:00 (UTC)
     *
     * @param chain
     * @param days
     * @returns
     */
    async getDailyBlocks(chain: Chain, days: number) {
        const blocks = await db.$queryRawUnsafe<{ timestamp: number; number: number }[]>(`
            SELECT 
                ("blockTimestamp"/86400)::INTEGER * 86400 as timestamp,
                MIN("blockNumber") as number
            FROM "PartitionedPoolEvent"
            WHERE chain = '${chain}'
            AND "blockTimestamp" >= ((EXTRACT(EPOCH FROM NOW()) / 86400)::integer * 86400 - 86400 * ${days})::integer
            GROUP BY 1
            ORDER BY 1 DESC;
        `);

        return blocks;
    },
});
