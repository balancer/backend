import { CloudwatchMetricsPublisher } from './metrics.client';

const publishers: Record<string, CloudwatchMetricsPublisher> = {};

export function getCronMetricsPublisher(chainId: string): CloudwatchMetricsPublisher {
    if (!publishers[chainId]) {
        console.log(`Creating new publisher for chain ${chainId}`);
        publishers[chainId] = new CloudwatchMetricsPublisher(`Backend-${chainId}/CronRuns`);
    }
    return publishers[chainId];
}
