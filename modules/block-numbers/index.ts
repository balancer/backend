import { Chain } from '@prisma/client';
import { eventsRepository, BlockNumbersRepository } from '../repositories/events';

export const blockNumbers = (repo: BlockNumbersRepository = eventsRepository) => ({
    /**
     * Get the block number for a given timestamp
     *
     * @param chain
     * @param timestamp
     * @returns
     */
    async getBlock(chain: Chain, timestamp: number) {
        const event = await repo.getLatestEvent({ chain, timestamp });

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
        const blocks = await repo.getDailyBlockNumbers(chain, days);

        return blocks;
    },
});
