import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { eventsRepository, TokenFlowsRepository } from '../../repositories/events';

interface PriceChartLPB {
    id: string;
    chain: Chain;
    startTime: number;
    endTime: number;
    projectToken: string;
    projectTokenStartWeight: number;
    projectTokenEndWeight: number;
    reserveToken: string;
    reserveTokenStartWeight: number;
    reserveTokenEndWeight: number;
}

export const priceChartData = async (
    pool: PriceChartLPB,
    dataPoints = 30,
    repo: TokenFlowsRepository = eventsRepository,
) => {
    const { chain, id, projectToken, reserveToken } = pool;

    // Calculate interval based on number of data points
    const interval = Math.floor(dataPoints > 1 ? (pool.endTime - pool.startTime) / (dataPoints - 1) : 0);

    // Get the token flows
    const flows = await repo.getTokenFlows(chain, id, projectToken, reserveToken, interval);

    if (flows.length === 0) return [];

    // Get the prices
    const prices = await prisma.prismaTokenPrice.findMany({
        where: {
            chain,
            tokenAddress: reserveToken,
            timestamp: {
                gte: flows[0].timestamp,
            },
        },
    });

    const sortedPrices = prices.sort((a, b) => a.timestamp - b.timestamp);

    // Generate complete timeline from startTime to endTime with specified number of data points
    const completeTimeline = generateCompleteTimeline(pool.startTime, pool.endTime, dataPoints, interval);

    // Calculate running balances for the intervals
    let balanceProject = 0;
    let balanceReserve = 0;

    // Check if there are any join/exit events before the start time
    const flowsBeforeStart = flows.filter((flow) => flow.timestamp < pool.startTime);

    for (const flow of flowsBeforeStart) {
        balanceProject += flow[projectToken] || 0;
        balanceReserve += flow[reserveToken] || 0;
    }

    // Create a map of existing flows for quick lookup
    const flowsMap = new Map(flows.map((flow) => [flow.timestamp, flow]));

    const balances = completeTimeline.map((timestamp) => {
        const existingFlow = flowsMap.get(timestamp);

        // Update balances if there's an existing flow
        if (existingFlow) {
            balanceProject += existingFlow[projectToken] || 0;
            balanceReserve += existingFlow[reserveToken] || 0;
        }

        // Find closest price by timestamp (for future timestamps, use last available price)
        const reservePrice = findReservePriceForTimestamp(sortedPrices, timestamp);

        // Calculate current weights and price
        const weights = calculateWeightsAtTime(pool, timestamp);

        const projectTokenPrice = calculatePrice(
            balanceProject,
            balanceReserve,
            weights.projectWeight,
            weights.reserveWeight,
        );

        const buyVolume = existingFlow?.buyVolume || 0;
        const sellVolume = existingFlow?.sellVolume || 0;

        return {
            timestamp,
            projectTokenPrice: projectTokenPrice,
            reservePrice: reservePrice,
            buyVolume,
            sellVolume,
        };
    });

    return balances;
};

/**
 * Generate complete timeline from startTime to endTime with specified number of data points
 * Timestamps are snapped to intervals using the same logic as the SQL query: FLOOR(timestamp / interval) * interval
 */
const generateCompleteTimeline = (
    startTime: number,
    endTime: number,
    dataPoints: number,
    interval: number,
): number[] => {
    if (dataPoints <= 0) {
        return [];
    }

    if (dataPoints === 1) {
        // Snap single timestamp to interval boundary
        return [Math.floor(startTime / interval) * interval];
    }

    const timeline: number[] = [];
    const timeRange = endTime - startTime;
    const step = timeRange / (dataPoints - 1);

    for (let i = 0; i < dataPoints; i++) {
        const rawTimestamp = startTime + step * i;
        // Snap to interval boundary using same logic as SQL query
        const snappedTimestamp = Math.floor(rawTimestamp / interval) * interval;
        timeline.push(snappedTimestamp);
    }

    // Remove duplicates that might occur due to snapping and sort
    return [...new Set(timeline)].sort((a, b) => a - b);
};

/**
 * Calculate weights at a specific timestamp using linear interpolation
 */
const calculateWeightsAtTime = (config: PriceChartLPB, timestamp: number) => {
    if (timestamp <= config.startTime) {
        return {
            projectWeight: config.projectTokenStartWeight,
            reserveWeight: config.reserveTokenStartWeight,
        };
    }

    if (timestamp >= config.endTime) {
        return {
            projectWeight: config.projectTokenEndWeight,
            reserveWeight: config.reserveTokenEndWeight,
        };
    }

    // Linear interpolation
    const duration = config.endTime - config.startTime;
    const progress = (timestamp - config.startTime) / duration;

    const projectWeight =
        config.projectTokenStartWeight + (config.projectTokenEndWeight - config.projectTokenStartWeight) * progress;

    const reserveWeight =
        config.reserveTokenStartWeight + (config.reserveTokenEndWeight - config.reserveTokenStartWeight) * progress;

    return { projectWeight, reserveWeight };
};

/**
 * Calculate price from balances and weights using weighted pool formula
 */
const calculatePrice = (
    projectBalance: number,
    reserveBalance: number,
    projectWeight: number,
    reserveWeight: number,
): number => {
    // Weighted pool formula: price = (reserveBalance / reserveWeight) / (projectBalance / projectWeight)
    const reserveRatio = reserveBalance / reserveWeight;
    const projectRatio = projectBalance / projectWeight;

    return reserveRatio / projectRatio;
};

/**
 * Find reserve price for a given timestamp, using last available price for future timestamps
 */
const findReservePriceForTimestamp = (sortedPrices: any[], targetTimestamp: number): number => {
    if (sortedPrices.length === 0) return 0;

    // If timestamp is after all available prices, use the last price
    const lastPrice = sortedPrices[sortedPrices.length - 1];
    if (targetTimestamp >= lastPrice.timestamp) {
        return lastPrice.price || 0;
    }

    // Otherwise, find the closest price
    const closestPrice = findClosestPrice(sortedPrices, targetTimestamp);
    return closestPrice?.price || 0;
};

// Helper function to find closest price
function findClosestPrice(sortedPrices: any[], targetTimestamp: number) {
    if (sortedPrices.length === 0) return null;

    // Binary search for efficiency with large datasets
    let left = 0;
    let right = sortedPrices.length - 1;
    let closest = sortedPrices[0];
    let minDiff = Math.abs(sortedPrices[0].timestamp - targetTimestamp);

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midTime = sortedPrices[mid].timestamp;
        const diff = Math.abs(midTime - targetTimestamp);

        if (diff < minDiff) {
            minDiff = diff;
            closest = sortedPrices[mid];
        }

        if (midTime < targetTimestamp) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return closest;
}
