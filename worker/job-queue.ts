import { AllNetworkConfigs } from '../modules/network/network-config';
import * as Sentry from '@sentry/node';
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { env } from '../app/env';

class WokerQueue {
    constructor(private readonly client: SQSClient, private readonly queueUrl: string) {}

    public async sendWithInterval(json: string, intervalMs: number, deDuplicationId?: string): Promise<void> {
        try {
            await this.sendMessage(json, deDuplicationId);
            console.log(`Sent message to schedule job on queue ${env.WORKER_QUEUE_URL}: ${json}`);
        } catch (error) {
            console.log(error);
            Sentry.captureException(error);
        } finally {
            setTimeout(() => {
                this.sendWithInterval(json, intervalMs, deDuplicationId);
            }, intervalMs);
        }
    }

    public async sendMessage(json: string, deDuplicationId?: string, delaySeconds?: number): Promise<void> {
        const input: SendMessageCommandInput = {
            QueueUrl: this.queueUrl,
            MessageBody: json,
            MessageDeduplicationId: deDuplicationId,
            DelaySeconds: delaySeconds,
        };
        const command = new SendMessageCommand(input);
        await this.client.send(command);
    }
}

const workerQueue = new WokerQueue(new SQSClient({}), env.WORKER_QUEUE_URL);

export async function scheduleJobs(chainId: string): Promise<void> {
    for (const job of AllNetworkConfigs[chainId].workerJobs) {
        console.log(`Initializing job ${job.name}-${chainId}-init`);
        await workerQueue.sendWithInterval(JSON.stringify({ name: job.name, chain: chainId }), job.interval);
    }
}
