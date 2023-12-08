import { Chain } from '@prisma/client';
import { CloudwatchMetricsPublisher } from './metrics.client';

const publishers: Record<string, CloudwatchMetricsPublisher> = {};

export function getSorMetricsPublisher(chain: Chain): CloudwatchMetricsPublisher {
    if (!publishers[chain]) {
        console.log(`Creating new SOR publisher for ${chain}`);
        publishers[chain] = new CloudwatchMetricsPublisher(`Backend-${chain}/Sor`);
    }
    return publishers[chain];
}
