import { CloudwatchMetricsPublisher } from './metrics.client';
import { networkContext } from '../network/network-context.service';

export function getCronMetricsPublisher(): CloudwatchMetricsPublisher {
    return new CloudwatchMetricsPublisher(`Backend-${networkContext.data.chain.slug}/CronRuns)`);
}
