import * as Sentry from '@sentry/node';
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { env } from '../../app/env';

class WokerQueue {
    constructor(private readonly client: SQSClient, private readonly queueUrl: string) {}

    public async sendMessage(json: string, delaySeconds?: number): Promise<void> {
        const input: SendMessageCommandInput = {
            QueueUrl: this.queueUrl,
            MessageBody: json,
            DelaySeconds: delaySeconds,
        };
        const command = new SendMessageCommand(input);
        await this.client.send(command);
    }
    public async sendWithMinimumInterval(json: string, minIntervalMs: number): Promise<void> {
        const startTime = Date.now();
        try {
            await this.sendMessage(json);
        } catch (error) {
            console.log(error);
            Sentry.captureException(error);
        } finally {
            const delay = minIntervalMs - (Date.now() - startTime);
            setTimeout(() => {
                this.sendWithMinimumInterval(json, minIntervalMs);
            }, Math.max(0, delay));
        }
    }
}

export const workerQueue = new WokerQueue(new SQSClient({}), env.WORKER_QUEUE_URL);
