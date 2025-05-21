import { PrismaPoolAprItem } from '@prisma/client';
import type { PoolAPRData } from './apr-repository';
export type { PoolAPRData };

export interface AprHandler {
    /**
     * Calculate APR for the given pools
     * @param pools Array of pools to calculate APR for
     * @returns Array of APR items ready to be saved (without createdAt/updatedAt)
     */
    calculateAprForPools(pools: PoolAPRData[]): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]>;

    /**
     * Get the name of this calculator
     */
    getAprServiceName(): string;
}

/**
 * Types of APR calculators available in the system
 */
export type AprCalculatorType =
    | 'swapFeeApr'
    | 'boostedPoolApr'
    | 'dynamicSwapFeeApr'
    | 'gaugeApr'
    | 'veBalProtocolApr'
    | 'veBalVotingApr'
    | 'morphoRewardsApr'
    | 'ybTokensApr'
    | 'aaveApiApr'
    | 'masterchefFarmApr'
    | 'reliquaryFarmApr'
    | 'beetswarsGaugeVotingApr'
    | 'quantAmmApr';

/**
 * Configuration for APR calculators
 */
export interface AprCalculatorConfig {
    type: AprCalculatorType;
    params?: Record<string, any>;
}
