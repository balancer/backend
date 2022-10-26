import { prisma } from '../../prisma/prisma-client';
import { google } from 'googleapis';
import { env } from '../../app/env';
import { DeploymentEnv, networkConfig } from '../config/network-config';
import moment from 'moment-timezone';
import { JWT } from 'google-auth-library';
import { SecretsManager, secretsManager } from './secrets-manager';
import { googleJwtClient, GoogleJwtClient } from './google-jwt-client';

export class DatastudioService {
    constructor(
        private readonly secretsManager: SecretsManager,
        private readonly jwtClientHelper: GoogleJwtClient,
        private readonly databaseTabeName: string,
        private readonly sheetId: string,
        private readonly compositionTabName: string,
        private readonly swapProtocolFeePercentage: number,
    ) {}

    public async feedPoolData() {
        const privateKey = await this.secretsManager.getSecret('backend-v2-datafeed-privatekey');
        const jwtClient = await this.jwtClientHelper.getAuthorizedSheetsClient(privateKey);

        const sheets = google.sheets({ version: 'v4' });

        const range = `${this.databaseTabeName}!B2:G`;
        let currentSheetValues;
        currentSheetValues = await sheets.spreadsheets.values.get({
            auth: jwtClient,
            spreadsheetId: this.sheetId,
            range: range,
        });

        let lastRun = moment.tz('GMT').startOf('day').subtract(1, 'day').unix();
        if (currentSheetValues.data.values) {
            lastRun = currentSheetValues.data.values[currentSheetValues.data.values.length - 1][0];
        }

        if (lastRun > moment.tz('GMT').subtract(1, 'day').unix()) {
            // 24 hours did not pass since the last run
            return;
        }

        const today = moment.tz('GMT').startOf('day');

        const allPoolDataRows: string[][] = [];
        const allPoolCompositionRows: string[][] = [];
        const pools = await prisma.prismaPool.findMany({
            where: {
                dynamicData: {
                    totalLiquidity: { gte: 5000 },
                },
            },
            include: {
                dynamicData: true,
                tokens: {
                    include: {
                        dynamicData: true,
                    },
                },
                allTokens: {
                    include: {
                        token: true,
                    },
                },
            },
        });
        for (const pool of pools) {
            let sharesChange = `0`;
            let tvlChange = `0`;
            let lpSwapFee = `0`;
            let protocolSwapFee = `0`;
            let dailySwaps = `0`;

            const yesterday = moment.tz('GMT').startOf('day').subtract(1, 'day').unix();

            let lastTotalSwaps = `0`;
            //find last entry of pool in currentSheet and get total swaps
            if (currentSheetValues.data.values) {
                // string[row][column], index 1 is address, index 5 total swap count
                currentSheetValues.data.values.forEach((row: string[]) => {
                    if (pool.address === row[1] && yesterday.toString() === row[0]) {
                        lastTotalSwaps = row[5];
                    }
                });
            }

            if (pool.dynamicData) {
                sharesChange = `${
                    parseFloat(pool.dynamicData.totalShares24hAgo) - parseFloat(pool.dynamicData.totalShares)
                }`;
                tvlChange = `${pool.dynamicData.totalLiquidity24hAgo - pool.dynamicData.totalLiquidity}`;
                lpSwapFee = `${pool.dynamicData.fees24h * (1 - this.swapProtocolFeePercentage)}`;
                protocolSwapFee = `${pool.dynamicData.fees24h * this.swapProtocolFeePercentage}`;

                dailySwaps = `${pool.dynamicData.swapsCount - parseFloat(lastTotalSwaps)}`;
            }

            const poolDataRow: string[] = [];

            const swapFee = pool.dynamicData?.swapFee || `0`;

            poolDataRow.push(
                today.format('DD MMM YYYY'),
                `${today.unix()}`,
                pool.address,
                pool.type,
                pool.name,
                swapFee,
                pool.dynamicData?.swapsCount ? `${pool.dynamicData.swapsCount}` : `0`,
                pool.symbol,
                pool.dynamicData?.totalLiquidity ? `${pool.dynamicData.totalLiquidity}` : `0`,
                pool.dynamicData?.totalShares ? `${pool.dynamicData.totalShares}` : `0`,
                pool.dynamicData?.lifetimeSwapFees ? `${pool.dynamicData.lifetimeSwapFees}` : `0`,
                pool.dynamicData?.lifetimeVolume ? `${pool.dynamicData.lifetimeVolume}` : `0`,
                pool.dynamicData?.volume24h ? `${pool.dynamicData.volume24h}` : `0`,
                pool.dynamicData?.fees24h ? `${pool.dynamicData.fees24h}` : `0`,
                sharesChange,
                tvlChange,
                dailySwaps,
                `1`,
                lpSwapFee,
                protocolSwapFee,
            );
            allPoolDataRows.push(poolDataRow);

            const allTokens = pool.allTokens.map((token) => {
                const poolToken = pool.tokens.find((poolToken) => poolToken.address === token.token.address);

                return {
                    ...token.token,
                    weight: poolToken?.dynamicData?.weight,
                };
            });

            for (const token of allTokens) {
                const poolCompositionRow: string[] = [];
                poolCompositionRow.push(
                    token.address,
                    token.name,
                    pool.id,
                    pool.address,
                    token.symbol,
                    token.weight ? token.weight : `0`,
                    pool.name,
                );
                allPoolCompositionRows.push(poolCompositionRow);
            }
        }

        this.appendDataInSheet(this.databaseTabeName, 'A1:T1', allPoolDataRows, jwtClient);

        this.updateDataInSheet(
            this.compositionTabName,
            `A2:G${allPoolCompositionRows.length + 1}`,
            allPoolCompositionRows,
            jwtClient,
        );
    }

    private async updateDataInSheet(tabName: string, rowRange: string, rows: string[][], jwtClient: JWT) {
        const sheets = google.sheets({ version: 'v4' });

        await sheets.spreadsheets.values.update({
            auth: jwtClient,
            spreadsheetId: this.sheetId,
            range: `${tabName}!${rowRange}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                majorDimension: 'ROWS',
                range: `${tabName}!${rowRange}`,
                values: rows,
            },
        });
    }

    private async appendDataInSheet(tabName: string, rowRange: string, rows: string[][], jwtClient: JWT) {
        const sheets = google.sheets({ version: 'v4' });

        await sheets.spreadsheets.values.append({
            auth: jwtClient,
            spreadsheetId: this.sheetId,
            range: `${tabName}!${rowRange}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                majorDimension: 'ROWS',
                range: `${tabName}!${rowRange}`,
                values: rows,
            },
        });
    }
}

export const datastudioService = new DatastudioService(
    secretsManager,
    googleJwtClient,
    networkConfig.datastudio[env.DEPLOYMENT_ENV as DeploymentEnv].databaseTabName,
    networkConfig.datastudio[env.DEPLOYMENT_ENV as DeploymentEnv].sheetId,
    networkConfig.datastudio[env.DEPLOYMENT_ENV as DeploymentEnv].compositionTabName,
    networkConfig.balancer.swapProtocolFeePercentage,
);
