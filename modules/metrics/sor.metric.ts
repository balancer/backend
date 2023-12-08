import { Chain } from '@prisma/client';
import { CloudwatchMetricsPublisher } from './metrics.client';

const publishers: Record<string, CloudwatchMetricsPublisher> = {};

export const publishMetric = (chain: Chain, metricName: string, value: number) => {
    if (process.env.NODE_ENV !== 'production') return Promise.resolve();

    return getSorMetricsPublisher(chain).publish(metricName, value);
};

function getSorMetricsPublisher(chain: Chain): CloudwatchMetricsPublisher {
    if (!publishers[chain]) {
        console.log(`Creating new SOR publisher for ${chain}`);
        publishers[chain] = new CloudwatchMetricsPublisher(`Backend-${chain}/Sor`);
    }
    return publishers[chain];
}
