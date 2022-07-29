import * as Sentry from '@sentry/node';
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { env } from '../../app/env';

class WokerQueue {
    constructor(private readonly client: SQSClient, private readonly queueUrl: string) {}

    public async sendMessage(json: string, deDublicationId?: string, delaySeconds?: number): Promise<void> {
        const input: SendMessageCommandInput = {
            QueueUrl: this.queueUrl,
            MessageBody: json,
            MessageDeduplicationId: deDublicationId,
            DelaySeconds: delaySeconds,
        };
        const command = new SendMessageCommand(input);
        await this.client.send(command);
    }
    public async sendWithInterval(json: string, intervalMs: number, deDuplicationId?: string): Promise<void> {
        try {
            await this.sendMessage(json, deDuplicationId);
        } catch (error) {
            console.log(error);
            Sentry.captureException(error);
        } finally {
            setTimeout(() => {
                this.sendWithInterval(json, intervalMs, deDuplicationId);
            }, intervalMs);
        }
    }
}

export const workerQueue = new WokerQueue(new SQSClient({}), env.WORKER_QUEUE_URL);
