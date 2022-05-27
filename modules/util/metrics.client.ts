import {
    CloudWatchClient,
    CloudWatchClientConfig,
    MetricDatum,
    PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { env } from '../../app/env';

export interface NotificationsCloudwatchMetric {
    merticData: MetricDatum[];
    nameSpace: string;
}

export abstract class MetricPublisher {
    protected metricName: string;
    protected namespace: string;
    protected environment: string;
    protected configuration?: CloudWatchClientConfig;
    private client: CloudWatchClient;

    constructor(metricName: string, namespace: string, configuration?: CloudWatchClientConfig) {
        this.metricName = metricName;
        this.namespace = namespace;
        this.environment = env.NODE_ENV;
        this.client = new CloudWatchClient(this.getOrDefaultConfig());
    }

    public async publish(count?: number): Promise<void> {
        try {
            const command = new PutMetricDataCommand({
                MetricData: [
                    {
                        MetricName: this.metricName,
                        Dimensions: [
                            {
                                Name: 'Environment',
                                Value: this.environment,
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
            console.log('Failed to publish metric ', err);
            return;
        }
    }

    private getOrDefaultConfig(): CloudWatchClientConfig {
        return this.configuration
            ? this.configuration
            : {
                  region: env.AWS_REGION,
                  credentials: { accessKeyId: env.AWS_ACCESSKEY, secretAccessKey: env.AWS_SECRETKEY },
              };
    }
}
