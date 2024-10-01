import axios from 'axios';
import { AllNetworkConfigs } from '../../modules/network/network-config';
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { env } from '../env';

class WokerQueue {
    constructor(private readonly client: SQSClient, private readonly queueUrl?: string) {}

    public async sendWithInterval(json: string, intervalMs: number, deDuplicationId?: string): Promise<void> {
        try {
            if (this.queueUrl === undefined) {
                return;
            }

            if (this.queueUrl.match(/localhost/)) {
                await this.sendLocalMessage(json);
            } else {
                await this.sendMessage(json, deDuplicationId);
            }
            console.log(`Sent message to schedule job on queue ${this.queueUrl}: ${json}`);
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(() => {
                this.sendWithInterval(json, intervalMs, deDuplicationId);
            }, intervalMs);
        }
    }

    public async sendLocalMessage(json: string): Promise<void> {
        if (this.queueUrl === undefined) {
            throw new Error('WORKER_QUEUE_URL is undefined');
        }

        await axios.post(this.queueUrl, json, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
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
