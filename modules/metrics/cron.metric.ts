import { CloudwatchMetricsPublisher } from './metrics.client';

const publishers: Record<string, CloudwatchMetricsPublisher> = {};

export function getCronMetricsPublisher(chainId: string, jobId: string): CloudwatchMetricsPublisher {
    if (!publishers[`${jobId}-${chainId}`]) {
        console.log(`Creating new publisher for ${jobId}-${chainId}`);
        publishers[`${jobId}-${chainId}`] = new CloudwatchMetricsPublisher(`Backend-${chainId}/CronRuns`);
    }
    return publishers[`${jobId}-${chainId}`];
}
