import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { eventsRepository, TokenFlowsRepository } from '../../repositories/events';
import { SwapEvent, JoinExitEvent } from '../../../prisma/prisma-types';

interface PriceChartLPB {
    id: string;
    chain: Chain;
    createTime: number;
    startTime: number;
    endTime: number;
    projectToken: string;
    projectTokenStartWeight: number;
    projectTokenEndWeight: number;
    reserveToken: string;
    reserveTokenStartWeight: number;
    reserveTokenEndWeight: number;
}

interface TokenFlowData {
    timestamp: number;
    [key: string]: number; // Dynamic token addresses as keys
    swapCount: number;
    volume: number;
    buyVolume: number;
    sellVolume: number;
}

export const priceChartData = async (
    pool: PriceChartLPB,
    dataPoints = 30,
    repo: TokenFlowsRepository = eventsRepository,
) => {
    const { chain, id, projectToken, reserveToken } = pool;

    // Generate precise timeline
    const timeline = generatePreciseTimeline(pool.startTime, pool.endTime, dataPoints);

    // Get all events for the time range
    const allEvents = await repo.getAllEventsForTimeRange(chain, id, pool.createTime, pool.endTime);

    // Aggregate events by timeline points
    const flows = aggregateEventsByTimeline(allEvents, timeline, projectToken, reserveToken);

    if (flows.length === 0) return [];

    // Get the prices
    const prices = await prisma.prismaTokenPrice.findMany({
        where: {
            chain,
            tokenAddress: reserveToken,
            timestamp: {
                gte: pool.startTime,
                lte: pool.endTime,
            },
        },
    });

    const sortedPrices = prices.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate running balances for the timeline points
    let balanceProject = 0;
    let balanceReserve = 0;

    const balances = flows.map((flow) => {
        // Update balances with this flow
        balanceProject += flow[projectToken] || 0;
        balanceReserve += flow[reserveToken] || 0;

        // Find closest price by timestamp
        const reservePrice = findReservePriceForTimestamp(sortedPrices, flow.timestamp);

        // Calculate current weights and price
        const weights = calculateWeightsAtTime(pool, flow.timestamp);

        const projectTokenPrice = calculatePrice(
            balanceProject,
            balanceReserve,
            weights.projectWeight,
            weights.reserveWeight,
        );

        return {
            timestamp: flow.timestamp,
            projectTokenPrice: projectTokenPrice,
            reservePrice: reservePrice,
            buyVolume: flow.buyVolume,
            sellVolume: flow.sellVolume,
            volume: flow.volume,
            swapCount: flow.swapCount,
        };
    });

    return balances;
};

/**
 * Generate precise timeline from startTime to endTime with specified number of data points
 */
const generatePreciseTimeline = (startTime: number, endTime: number, dataPoints: number): number[] => {
    if (dataPoints <= 0) return [];
    if (dataPoints === 1) return [startTime];
    if (dataPoints === 2) return [startTime, endTime];

    const timeline: number[] = [];
    timeline.push(startTime);

    const timeRange = endTime - startTime;
    const step = timeRange / (dataPoints - 1);

    for (let i = 1; i < dataPoints - 1; i++) {
        timeline.push(Math.round(startTime + step * i));
    }

    timeline.push(endTime);
    return timeline;
};

/**
 * Aggregate events by timeline points - token flows are cumulative, other metrics are per bucket
 */
const aggregateEventsByTimeline = (
    events: (SwapEvent | JoinExitEvent)[],
    timeline: number[],
    tokenA: string,
    tokenB: string,
): TokenFlowData[] => {
    // Reverse events in-place to get ascending order for cumulative calculations
    // (events come from DB in descending order due to index optimization)
    events.reverse();

    return timeline.map((timestamp, index) => {
        // Get all events up to this timestamp for cumulative token flows
        const eventsUpToTimestamp = events.filter((event) => event.blockTimestamp <= timestamp);

        // Get events for this bucket only (for non-cumulative metrics)
        const previousTimestamp = index === 0 ? 0 : timeline[index - 1];
        const eventsInBucket = events.filter(
            (event) => event.blockTimestamp > previousTimestamp && event.blockTimestamp <= timestamp,
        );

        // Calculate cumulative token flows
        let tokenAFlow = 0;
        let tokenBFlow = 0;

        eventsUpToTimestamp.forEach((event) => {
            if (event.type === 'SWAP') {
                const swapEvent = event as SwapEvent;
                const tokenIn = swapEvent.payload.tokenIn;
                const tokenOut = swapEvent.payload.tokenOut;

                // Handle token A flows (cumulative)
                if (tokenIn.address.toLowerCase() === tokenA.toLowerCase()) {
                    tokenAFlow += parseFloat(tokenIn.amount);
                }
                if (tokenOut.address.toLowerCase() === tokenA.toLowerCase()) {
                    tokenAFlow -= parseFloat(tokenOut.amount);
                }

                // Handle token B flows (cumulative)
                if (tokenIn.address.toLowerCase() === tokenB.toLowerCase()) {
                    tokenBFlow += parseFloat(tokenIn.amount);
                }
                if (tokenOut.address.toLowerCase() === tokenB.toLowerCase()) {
                    tokenBFlow -= parseFloat(tokenOut.amount);
                }
            } else if (event.type === 'JOIN' || event.type === 'EXIT') {
                const joinExitEvent = event as JoinExitEvent;
                const tokens = joinExitEvent.payload.tokens;

                tokens.forEach((token) => {
                    const tokenAddress = token.address.toLowerCase();
                    const tokenAmount = parseFloat(token.amount);

                    if (tokenAddress === tokenA.toLowerCase()) {
                        tokenAFlow += event.type === 'JOIN' ? tokenAmount : -tokenAmount;
                    }
                    if (tokenAddress === tokenB.toLowerCase()) {
                        tokenBFlow += event.type === 'JOIN' ? tokenAmount : -tokenAmount;
                    }
                });
            }
        });

        // Calculate per-bucket metrics
        let swapCount = 0;
        let volume = 0;
        let buyVolume = 0;
        let sellVolume = 0;

        eventsInBucket.forEach((event) => {
            if (event.type === 'SWAP') {
                const swapEvent = event as SwapEvent;
                const tokenIn = swapEvent.payload.tokenIn;
                const tokenOut = swapEvent.payload.tokenOut;

                // Handle buy/sell volumes for this bucket only
                if (tokenIn.address.toLowerCase() === tokenA.toLowerCase()) {
                    sellVolume += parseFloat(tokenIn.amount);
                }
                if (tokenOut.address.toLowerCase() === tokenA.toLowerCase()) {
                    buyVolume += parseFloat(tokenOut.amount);
                }

                swapCount++;
                volume += swapEvent.valueUSD || 0;
            }
        });

        return {
            timestamp,
            [tokenA]: tokenAFlow,
            [tokenB]: tokenBFlow,
            swapCount,
            volume,
            buyVolume,
            sellVolume,
        };
    });
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
    if (projectBalance <= 0 || reserveBalance <= 0) return 0;

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

    // If timestamp is before first price, use first price
    const firstPrice = sortedPrices[0];
    if (targetTimestamp <= firstPrice.timestamp) {
        return firstPrice.price || 0;
    }

    // Otherwise, find the closest price
    const closestPrice = findClosestPrice(sortedPrices, targetTimestamp);
    return closestPrice?.price || 0;
};

/**
 * Helper function to find closest price using binary search
 */
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
