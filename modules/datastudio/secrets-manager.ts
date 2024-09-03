import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { env } from '../../apps/env';

export class SecretsManager {
    public async getSecret(secretId: string): Promise<string> {
        const secretManagerClient = new SecretsManagerClient({ region: env.AWS_REGION });

        let secretValue = '';
        const response = await secretManagerClient.send(new GetSecretValueCommand({ SecretId: secretId }));
        if (response.SecretString) {
            const jsonSecret = JSON.parse(response.SecretString);
            secretValue = jsonSecret.key;
        }
        return secretValue;
    }
}

export const secretsManager = new SecretsManager();
