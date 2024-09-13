import {
    CloudWatchClient,
    CloudWatchClientConfig,
    MetricDatum,
    PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { env } from '../../apps/env';

export interface NotificationsCloudwatchMetric {
    merticData: MetricDatum[];
    nameSpace: string;
}

export class CloudwatchCronDurationMetricsPublisher {
    protected environment: string;
    protected configuration?: CloudWatchClientConfig;
    private client: CloudWatchClient;
    public namespace: string;

    constructor(
        namespace: string = 'default',
        environment: string = env.DEPLOYMENT_ENV,
        configuration?: CloudWatchClientConfig,
    ) {
        this.namespace = namespace;
        this.environment = environment;
        this.client = new CloudWatchClient({ region: env.AWS_REGION, ...configuration });
    }

    public async publish(metricName: string, count?: number): Promise<void> {
        const [major, minor, patch] = process.versions.node.split('.').map(Number);
        try {
            const command = new PutMetricDataCommand({
                MetricData: [
                    {
                        MetricName: metricName,
                        Dimensions: [
                            {
                                Name: 'Environment',
                                Value: this.environment,
                            },
                            {
                                Name: 'NodeVersion',
                                Value: major.toString(),
                            },
                        ],
                        Unit: 'None',
                        Timestamp: new Date(),
                        Value: count ? count : 1,
                    },
                ],
                Namespace: this.namespace,
            });

            await this.client.send(command);
        } catch (err) {
            // Sentry.captureException(`Failed to publish "${metricName}" in "${this.environment}: ${err}`);
            console.log(`Failed to publish "${metricName}" in "${this.environment}: ${err}`);
        }
    }
}

export const cronsDurationMetricPublisher = new CloudwatchCronDurationMetricsPublisher('backendCronsDuration');
