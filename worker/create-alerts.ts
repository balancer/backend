import {
    CloudWatchClient,
    DeleteAlarmsCommand,
    DescribeAlarmsCommand,
    PutMetricAlarmCommand,
} from '@aws-sdk/client-cloudwatch';
import { env } from '../app/env';
import { getCronMetricsPublisher } from '../modules/metrics/cron.metric';
import { AllNetworkConfigs } from '../modules/network/network-config';
import { DeploymentEnv } from '../modules/network/network-config-types';
import { networkContext } from '../modules/network/network-context.service';
import { WorkerJob } from './job-handlers';

export async function createAlerts(chainId: string): Promise<void> {
    await createAlertsIfNotExist(chainId, AllNetworkConfigs[chainId].workerJobs);
}

async function createAlertsIfNotExist(chainId: string, jobs: WorkerJob[]): Promise<void> {
    const cronsMetricPublisher = getCronMetricsPublisher(chainId);
    const cloudWatchClient = new CloudWatchClient({
        region: env.AWS_REGION,
    });

    const currentAlarms = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

    for (const cronJob of jobs) {
        const alarmName = `AUTO CRON ALARM MULTICHAIN: ${cronJob.name} - ${chainId} - ${env.DEPLOYMENT_ENV}`;

        // alert if cron has not run once in the tripple interval (or once in two minutes for short intervals)
        const threshold = 1;
        let periodInSeconds = (cronJob.interval / 1000) * 3;
        if (periodInSeconds < 120) {
            periodInSeconds = 120;
        }

        // AWS: Metrics cannot be checked across more than a day (EvaluationPeriods * Period must be <= 86400)
        // We have one Job that runs once a day, create alert for once a day
        if (periodInSeconds > 86400) {
            periodInSeconds = cronJob.interval / 1000;
            if (periodInSeconds > 86400) {
                console.log(`Cant create alert for ${cronJob.name} because interval is too big: ${cronJob.interval}ms`);
                continue;
            }
        }

        const foundAlarm = currentAlarms.MetricAlarms?.find((alarm) => alarm.AlarmName === alarmName);
        if (foundAlarm) {
            if (foundAlarm.Period != periodInSeconds) {
                await cloudWatchClient.send(new DeleteAlarmsCommand({ AlarmNames: [alarmName] }));
            } else {
                continue;
            }
        }

        //make sure metric is available for alarm
        await cronsMetricPublisher.publish(`${cronJob.name}-${chainId}-done`);

        const putAlarmCommand = new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `The cron job ${cronJob.name} should run every ${cronJob.interval / 1000} seconds. 
            Trigger alarm if the cron ran less than once in ${periodInSeconds} seconds.`,
            ActionsEnabled: true,
            AlarmActions: [networkContext.data.monitoring[env.DEPLOYMENT_ENV as DeploymentEnv].alarmTopicArn],
            OKActions: [networkContext.data.monitoring[env.DEPLOYMENT_ENV as DeploymentEnv].alarmTopicArn],
            MetricName: `${cronJob.name}-${chainId}-done`,
            Statistic: 'Sum',
            Dimensions: [{ Name: 'Environment', Value: env.DEPLOYMENT_ENV }],
            Period: periodInSeconds,
            EvaluationPeriods: 1,
            DatapointsToAlarm: 1,
            Threshold: threshold,
            ComparisonOperator: 'LessThanThreshold',
            TreatMissingData: 'breaching',
            Namespace: cronsMetricPublisher.namespace,
        });

        await cloudWatchClient.send(putAlarmCommand);
    }
}
