/**
 * Runs a function with a minimum interval taking execution time into account.
 * If the execution time is less than the minimum interval, the function will be run in the next interval.
 * If the execution time is greater than the minimum interval, the function will be run immediately.
 *
 * @param minIntervalMs The minimum interval in milliseconds.
 * @param fn The function to run. Supports async functions
 */
export async function runWithMinimumInterval(minIntervalMs: number, fn: () => Promise<any>) {
    const startTime = Date.now();
    try {
        await fn();
    } catch (error) {
        console.log(error);
    } finally {
        const delay = minIntervalMs - (Date.now() - startTime);
        setTimeout(() => {
            runWithMinimumInterval(minIntervalMs, fn);
        }, Math.max(0, delay));
    }
}
