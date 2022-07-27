import * as Sentry from '@sentry/node';

/**
 * Runs a function with a minimum interval taking execution time into account.
 * If the execution time is less than the minimum interval, the function will be run in the next interval.
 * If the execution time is greater than the minimum interval, the function will be run immediately.
 *
 * @param taskName Name of the task
 * @param minIntervalMs The minimum interval in milliseconds.
 * @param fn The function to run. Supports async functions
 */
export async function runWithMinimumInterval(taskName: string, minIntervalMs: number, fn: () => Promise<any>) {
    const transaction = Sentry.startTransaction({ name: taskName });
    Sentry.withScope((scope) => {
        scope.setSpan(transaction);
        const startTime = Date.now();
        fn()
            .catch((error) => {
                Sentry.captureException(error);
                console.log(`Error ${taskName}`, error);
            })
            .finally(() => {
                transaction.finish();
                const delay = minIntervalMs - (Date.now() - startTime);
                setTimeout(() => {
                    runWithMinimumInterval(taskName, minIntervalMs, fn);
                }, Math.max(0, delay));
            });
    });
}
