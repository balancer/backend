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
    initialReserveTokenVirtualBalance?: string;
}

interface TokenFlowData {
    timestamp: number;
    [key: string]: number; // Dynamic token addresses as keys
    swapCount: number;
    volume: number;
    cumulativeVolume: number;
    fees: number;
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
    const allEvents = await repo.getAllEventsForTimeRange(chain, id, undefined, pool.endTime);

    // Aggregate events by timeline points
    const flows = aggregateEventsByTimeline(
        allEvents,
        timeline,
        projectToken,
        reserveToken,
        pool.initialReserveTokenVirtualBalance,
    );

    if (flows.length === 0) return [];

    // Get the prices, use current price if LBP has not started yet. Subtract 4 hours from start
    const now = Math.floor(Date.now() / 1000);
    const startPriceTime = now < pool.startTime ? now : pool.startTime;
    const prices = await prisma.prismaTokenPrice.findMany({
        where: {
            chain,
            tokenAddress: reserveToken,
            timestamp: {
                gte: startPriceTime - 4 * 60 * 60, // Subtract 4 hours from start
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
        balanceProject = flow[projectToken] || 0;
        balanceReserve = flow[reserveToken] || 0;

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

        // Calculate TVL (Total Value Locked) in USD
        const projectTokenValueUSD = balanceProject * projectTokenPrice;
        const reserveTokenValueUSD = balanceReserve * reservePrice;
        const tvl = projectTokenValueUSD + reserveTokenValueUSD;

        return {
            timestamp: flow.timestamp,
            projectTokenBalance: balanceProject,
            reserveTokenBalance: balanceReserve,
            projectTokenPrice: projectTokenPrice,
            reservePrice: reservePrice,
            buyVolume: flow.buyVolume,
            sellVolume: flow.sellVolume,
            volume: flow.volume,
            swapCount: flow.swapCount,
            tvl: tvl,
            fees: flow.fees,
            cumulativeFees: flow.cumulativeFees,
            cumulativeVolume: flow.cumulativeVolume,
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
    projectToken: string,
    reserveToken: string,
    initialReserveTokenVirtualBalance?: string,
): TokenFlowData[] => {
    // Reverse events in-place to get ascending order for cumulative calculations
    // (events come from DB in descending order due to index optimization)
    events.reverse();

    let cumulativeVolume = 0;
    let cumulativeFees = 0;

    return timeline.map((timestamp, index) => {
        // Get all events up to this timestamp for cumulative token flows
        const eventsUpToTimestamp = events.filter((event) => event.blockTimestamp <= timestamp);

        // Get events for this bucket only (for non-cumulative metrics)
        const previousTimestamp = index === 0 ? 0 : timeline[index - 1];
        const eventsInBucket = eventsUpToTimestamp.filter((event) => event.blockTimestamp > previousTimestamp);

        // Calculate cumulative token flows
        let projectTokenFlow = 0;
        let reserveTokenFlow = initialReserveTokenVirtualBalance ? parseFloat(initialReserveTokenVirtualBalance) : 0;

        eventsUpToTimestamp.forEach((event) => {
            if (event.type === 'SWAP') {
                const swapEvent = event as SwapEvent;
                const tokenIn = swapEvent.payload.tokenIn;
                const tokenOut = swapEvent.payload.tokenOut;

                // Handle project token flows (cumulative)
                if (tokenIn.address.toLowerCase() === projectToken.toLowerCase()) {
                    projectTokenFlow += parseFloat(tokenIn.amount);
                }
                if (tokenOut.address.toLowerCase() === projectToken.toLowerCase()) {
                    projectTokenFlow -= parseFloat(tokenOut.amount);
                }

                // Handle token B flows (cumulative)
                if (tokenIn.address.toLowerCase() === reserveToken.toLowerCase()) {
                    reserveTokenFlow += parseFloat(tokenIn.amount);
                }
                if (tokenOut.address.toLowerCase() === reserveToken.toLowerCase()) {
                    reserveTokenFlow -= parseFloat(tokenOut.amount);
                }
            } else {
                const joinExitEvent = event as JoinExitEvent;
                const tokens = joinExitEvent.payload.tokens;

                tokens.forEach((token) => {
                    const tokenAddress = token.address.toLowerCase();
                    const tokenAmount = parseFloat(token.amount);

                    if (tokenAddress === reserveToken.toLowerCase()) {
                        reserveTokenFlow += event.type === 'JOIN' ? tokenAmount : -tokenAmount;
                    }
                    if (tokenAddress === projectToken.toLowerCase()) {
                        projectTokenFlow += event.type === 'JOIN' ? tokenAmount : -tokenAmount;
                    }
                });
            }
        });

        // Calculate per-bucket metrics
        let swapCount = 0;
        let volume = 0;
        let buyVolume = 0;
        let sellVolume = 0;
        let fees = 0;

        eventsInBucket.forEach((event) => {
            if (event.type === 'SWAP') {
                const swapEvent = event as SwapEvent;
                const tokenIn = swapEvent.payload.tokenIn;
                const tokenOut = swapEvent.payload.tokenOut;
                const fee = swapEvent.payload.fee;

                // Handle buy/sell volumes for this bucket only
                if (tokenIn.address.toLowerCase() === projectToken.toLowerCase()) {
                    sellVolume += parseFloat(tokenIn.amount);
                }
                if (tokenOut.address.toLowerCase() === projectToken.toLowerCase()) {
                    buyVolume += parseFloat(tokenOut.amount);
                }

                swapCount++;
                volume += parseFloat(`${swapEvent.valueUSD}`) || 0;
                fees += parseFloat(fee.valueUSD) || 0;
            }
        });

        cumulativeVolume += volume;
        cumulativeFees += fees;

        return {
            timestamp,
            [projectToken]: projectTokenFlow,
            [reserveToken]: reserveTokenFlow,
            swapCount,
            volume,
            fees,
            buyVolume,
            sellVolume,
            cumulativeVolume,
            cumulativeFees,
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
