import { CloudwatchMetricsPublisher } from './metrics.client';

export function getCronMetricsPublisher(chainId: string): CloudwatchMetricsPublisher {
    return new CloudwatchMetricsPublisher(`Backend-${chainId}/CronRuns`);
}
