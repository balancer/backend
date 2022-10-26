import { google } from 'googleapis';
import { env } from '../../app/env';
import { JWT } from 'google-auth-library';
import { DeploymentEnv, networkConfig } from '../config/network-config';

export class GoogleJwtClient {
    public async getAuthorizedSheetsClient(privateKey: string): Promise<JWT> {
        const jwtClient = new google.auth.JWT(
            networkConfig.datastudio[env.DEPLOYMENT_ENV as DeploymentEnv].user,
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
