import { Chain, PrismaPoolAprItem } from '@prisma/client';
import { AprHandler } from './types';
import { AprRepository } from './apr-repository';
import _ from 'lodash';

export class AprManager {
    constructor(
        private readonly aprRepository: AprRepository,
        private readonly aprHandlers: AprHandler[],
    ) {}

    /**
     * Calculate APRs without writing to the database
     */
    async calculateAprs(
        chain: Chain,
        poolIds?: string[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const pools = await this.aprRepository.getPoolsForAprCalculation(chain, poolIds);

        if (pools.length === 0) {
            return [];
        }

        // Get all APR items from all calculators
        const allAprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];
        const failedCalculators: string[] = [];

        for (const calculator of this.aprHandlers) {
            try {
                const items = await calculator.calculateAprForPools(pools);
                allAprItems.push(...items);
            } catch (e) {
                console.error(`Error during APR calculation in ${calculator.getAprServiceName()}:`, e);
                failedCalculators.push(calculator.getAprServiceName());
            }
        }

        if (failedCalculators.length > 0) {
            console.warn(`The following APR calculators failed: ${failedCalculators.join(', ')}`);
        }

        return allAprItems;
    }

    /**
     * Calculate and persist APRs
     */
    async updateAprs(chain: Chain, poolIds?: string[]): Promise<string[]> {
        const aprItems = await this.calculateAprs(chain, poolIds);
        const changedPoolIds = await this.aprRepository.savePoolAprItems(aprItems);

        if (changedPoolIds.length > 0) {
            await this.aprRepository.updatePoolTotalApr(chain, changedPoolIds);
        }

        return changedPoolIds;
    }

    /**
     * Reload all APRs for a chain (deletes existing data first)
     * @returns Update statistics
     */
    async reloadAllPoolAprs(chain: Chain): Promise<string[]> {
        await this.aprRepository.deleteAllPoolAprItems(chain);
        return this.updateAprs(chain);
    }
}
