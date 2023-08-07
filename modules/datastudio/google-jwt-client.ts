import { google } from 'googleapis';
import { env } from '../../app/env';
import { JWT } from 'google-auth-library';
import { networkContext } from '../network/network-context.service';
import { DeploymentEnv } from '../network/network-config-types';

export class GoogleJwtClient {
    public async getAuthorizedSheetsClient(privateKey: string): Promise<JWT> {
        const jwtClient = new google.auth.JWT(
            networkContext.data.datastudio![env.DEPLOYMENT_ENV as DeploymentEnv].user,
            undefined,
            privateKey,
            'https://www.googleapis.com/auth/spreadsheets',
        );
        await jwtClient.authorize(function (err, result) {
            if (err) {
                console.log(`Error authorizing google jwt client: ${err}`);
            }
        });
        return jwtClient;
    }
}

export const googleJwtClient = new GoogleJwtClient();
