import { Chain, PrismaPoolAprItem } from '@prisma/client';
import { AprHandler } from './types';
import { AprRepository } from './apr-repository';
import { AprManager } from './apr-manager';
import { createHandlers } from './handlers';

export class AprService {
    private readonly aprRepository: AprRepository;

    constructor() {
        this.aprRepository = new AprRepository();
    }

    /**
     * Create appropriate handlers for a specific chain
     */
    private createHandlersForChain(chain: Chain): AprHandler[] {
        return createHandlers(chain);
    }

    /**
     * Get manager for a specific chain
     */
    private getManagerForChain(chain: Chain): AprManager {
        const handlers = this.createHandlersForChain(chain);
        return new AprManager(this.aprRepository, handlers);
    }

    /**
     * Update APRs for all pools in a chain
     * @returns Updated pool IDs
     */
    async updateAprs(chain: Chain): Promise<string[]> {
        const manager = this.getManagerForChain(chain);
        return manager.updateAprs(chain);
    }

    /**
     * Remove all existing APR data and recalculate for a chain
     * @returns Updated pool IDs
     */
    async reloadAprs(chain: Chain): Promise<string[]> {
        const manager = this.getManagerForChain(chain);
        return manager.reloadAllPoolAprs(chain);
    }

    /**
     * Update APR for a specific pool
     * @returns Updated pool ID
     */
    async updateAprForPool(chain: Chain, poolId: string): Promise<string[]> {
        const manager = this.getManagerForChain(chain);
        return manager.updateAprs(chain, [poolId]);
    }

    /**
     * Calculate APR for a specific pool without writing to the database
     * Useful for testing and debugging
     */
    async calculateAprForPool(
        chain: Chain,
        poolId: string,
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const manager = this.getManagerForChain(chain);
        const aprItems = await manager.calculateAprs(chain, [poolId]);

        return aprItems;
    }
}
