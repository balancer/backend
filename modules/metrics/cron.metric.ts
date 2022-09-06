import { networkConfig } from '../config/network-config';
import { CloudwatchMetricsPublisher } from './metrics.client';

export const cronsMetricPublisher: CloudwatchMetricsPublisher = new CloudwatchMetricsPublisher(
    `Backend-${networkConfig.chain.slug}/CronRuns)`,
);
