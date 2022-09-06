import { CloudwatchMetricsPublisher } from './metrics.client';

export const cronsMetricPublisher: CloudwatchMetricsPublisher = new CloudwatchMetricsPublisher('Backend/CronRuns');
