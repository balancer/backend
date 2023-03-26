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
import * as Sentry from '@sentry/node';

const ALARM_PREFIX = `AUTO CRON ALARM MULTICHAIN:`;

export async function createAlerts(chainId: string): Promise<void> {
    await createAlertsIfNotExist(chainId, AllNetworkConfigs[chainId].workerJobs);
}

async function createAlertsIfNotExist(chainId: string, jobs: WorkerJob[]): Promise<void> {
    const cronsMetricPublisher = getCronMetricsPublisher(chainId);
    const cloudWatchClient = new CloudWatchClient({
        region: env.AWS_REGION,
    });

    const currentAlarms = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

    // delete all alarms
    if (currentAlarms.MetricAlarms) {
        const cronAlarms = currentAlarms.MetricAlarms.filter((alarm) => alarm.AlarmName?.includes(ALARM_PREFIX));
        const alarmNames: string[] = [];
        for (const alarm of cronAlarms) {
            if (alarm.AlarmName) {
                alarmNames.push(alarm.AlarmName);
            }
        }
        await cloudWatchClient.send(new DeleteAlarmsCommand({ AlarmNames: alarmNames }));
    }

    for (const cronJob of jobs) {
        const alarmName = `${ALARM_PREFIX} ${cronJob.name} - ${chainId} - ${env.DEPLOYMENT_ENV}`;

        // set the evaluation period for the alarm to the job interval. Minimum period is 1 minute.
        let periodInSeconds = cronJob.interval / 1000;
        if (periodInSeconds < 60) {
            periodInSeconds = 60;
        }

        // AWS Metrics cannot be checked across more than a day (EvaluationPeriods * Period must be <= 86400)
        // We have one Job that runs once a day, create alert for once a day
        if (periodInSeconds > 86400) {
            periodInSeconds = cronJob.interval / 1000;
            if (periodInSeconds > 86400) {
                console.log(`Cant create alert for ${cronJob.name} because interval is too big: ${cronJob.interval}ms`);
                Sentry.captureException(
                    `Cant create alert for ${cronJob.name} because interval is too big: ${cronJob.interval}ms`,
                );
                continue;
            }
        }

        //make sure metric is available for alarm
        await cronsMetricPublisher.publish(`${cronJob.name}-${chainId}-done`);

        const evaluationPeriods = cronJob.alarmEvaluationPeriod ? cronJob.alarmEvaluationPeriod : 3;
        const datapointsToAlarm = cronJob.alarmDatapointsToAlarm ? cronJob.alarmDatapointsToAlarm : 3;

        const putAlarmCommand = new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `The cron job ${cronJob.name} should run every ${cronJob.interval / 1000} seconds. 
            Triggers alarm if the cron did not run at least once over the last ${
                periodInSeconds * evaluationPeriods
            } seconds.`,
            ActionsEnabled: true,
            AlarmActions: [networkContext.data.monitoring[env.DEPLOYMENT_ENV as DeploymentEnv].alarmTopicArn],
            OKActions: [networkContext.data.monitoring[env.DEPLOYMENT_ENV as DeploymentEnv].alarmTopicArn],
            MetricName: `${cronJob.name}-${chainId}-done`,
            Statistic: 'Sum',
            Dimensions: [{ Name: 'Environment', Value: env.DEPLOYMENT_ENV }],
            // This configures that it will alarm if the cron did not run once over the last three (or configred) intervals
            Period: periodInSeconds,
            Threshold: 1,
            EvaluationPeriods: evaluationPeriods,
            DatapointsToAlarm: datapointsToAlarm,
            ComparisonOperator: 'LessThanThreshold',
            TreatMissingData: 'breaching',
            Namespace: cronsMetricPublisher.namespace,
        });

        await cloudWatchClient.send(putAlarmCommand);
    }
}
