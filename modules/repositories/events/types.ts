import { Chain, PoolEventType } from '@prisma/client';
import { JoinExitEvent, SwapEvent } from '../../../prisma/prisma-types';

export type SwapStats = {
    poolId: string;
    volume: number;
    fees: number;
    dynamicFees?: number;
    surplus?: number;
    latestBlockNumber: number;
};

export type TokenAmount = {
    address: string;
    amount: string;
    valueUSD: number;
};

export interface SwapRepository {
    getSwapsForPricing: (chain: Chain) => Promise<SwapEvent[]>;
}

export interface LatestEventRepository {
    getLatestEvent: (params: {
        chain: Chain;
        protocolVersion?: number;
        types?: PoolEventType[];
        timestamp?: number;
        block?: number;
        poolId?: string;
    }) => Promise<SwapEvent | JoinExitEvent | null>;
}

export interface SwapStatsRepository {
    getSwapStats: (params: { chain: Chain; poolIds?: string[]; since: number }) => Promise<SwapStats[]>;
}

export interface BlockNumbersRepository extends LatestEventRepository {
    getDailyBlockNumbers: (chain: Chain, days: number) => Promise<{ timestamp: number; number: number }[]>;
}

export interface TokenFlowsRepository {
    getAllEventsForTimeRange: (
        chain: Chain,
        poolId: string,
        startTime?: number,
        endTime?: number,
    ) => Promise<(SwapEvent | JoinExitEvent)[]>;
}

export interface EventStoreRepository {
    storeEvents: (events: (SwapEvent | JoinExitEvent)[]) => Promise<boolean>;
}
