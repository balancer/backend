import {
    CloudWatchClient,
    DeleteAlarmsCommand,
    DescribeAlarmsCommand,
    PutMetricAlarmCommand,
} from '@aws-sdk/client-cloudwatch';
import { env } from '../app/env';
import { networkConfig } from '../modules/config/network-config';
import { cronsMetricPublisher } from '../modules/metrics/cron.metric';
import { WorkerJob } from './manual-jobs';

const euAlarmTopic = 'arn:aws:sns:eu-central-1:837533371577:Default_CloudWatch_Alarms_Topic';
const caAlarmTopic = 'arn:aws:sns:ca-central-1:837533371577:Default_CloudWatch_Alarms_Topic';

export async function createAlertsIfNotExist(jobs: WorkerJob[]): Promise<void> {
    const cloudWatchClient = new CloudWatchClient({
        region: env.AWS_REGION,
    });

    const currentAlarms = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

    for (const cronJob of jobs) {
        const alarmName = `AUTO CRON ALARM: ${cronJob.name} - ${networkConfig.chain.slug} - ${env.DEPLOYMENT_ENV}`;

        // alert if cron has not run once in the double interval (or once in a minute for short intervals)
        const threshold = 1;
        let periodInSeconds = (cronJob.interval / 1000) * 2;
        if (periodInSeconds < 60) {
            periodInSeconds = 60;
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
                cloudWatchClient.send(new DeleteAlarmsCommand({ AlarmNames: [alarmName] }));
            } else {
                continue;
            }
        }

        //make sure metric is available for alarm
        cronsMetricPublisher.publish(`${cronJob.name}-done`);

        const putAlarmCommand = new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `The cron job ${cronJob.name} should run every ${cronJob.interval / 1000} seconds. 
            Trigger alarm if the cron ran less than once in ${periodInSeconds} seconds.`,
            ActionsEnabled: true,
            AlarmActions: [env.AWS_REGION === 'eu-central-1' ? euAlarmTopic : caAlarmTopic],
            OKActions: [env.AWS_REGION === 'eu-central-1' ? euAlarmTopic : caAlarmTopic],
            MetricName: `${cronJob.name}-done`,
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
