import { prisma } from '../../prisma/prisma-client';
import { google } from 'googleapis';
import { env } from '../../app/env';
import { DeploymentEnv, networkConfig } from '../config/network-config';
import moment from 'moment-timezone';
import { JWT } from 'google-auth-library';
import { SecretsManager, secretsManager } from './secrets-manager';
import { googleJwtClient, GoogleJwtClient } from './google-jwt-client';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { tokenService } from '../token/token.service';
import { beetsService } from '../beets/beets.service';
import { secondsPerDay } from '../common/time';
import { truncate } from 'lodash';

export class DatastudioService {
    constructor(
        private readonly secretsManager: SecretsManager,
        private readonly jwtClientHelper: GoogleJwtClient,
        private readonly databaseTabName: string,
        private readonly sheetId: string,
        private readonly compositionTabName: string,
        private readonly emissionDataTabName: string,
        private readonly swapProtocolFeePercentage: number,
    ) {}

    public async feedPoolData() {
        const privateKey = await this.secretsManager.getSecret('backend-v2-datafeed-privatekey');
        const jwtClient = await this.jwtClientHelper.getAuthorizedSheetsClient(privateKey);

        const sheets = google.sheets({ version: 'v4' });

        const range = `${this.databaseTabName}!B2:G`;
        let currentSheetValues;
        currentSheetValues = await sheets.spreadsheets.values.get({
            auth: jwtClient,
            spreadsheetId: this.sheetId,
            range: range,
        });

        // if there are no values in the sheet, take end of the day before yesterday which means the feed will run now
        let lastRun = moment.tz('GMT').endOf('day').subtract(2, 'day').unix();
        if (currentSheetValues.data.values) {
            lastRun = currentSheetValues.data.values[currentSheetValues.data.values.length - 1][0];
        }

        if (lastRun > moment.tz('GMT').subtract(1, 'day').unix()) {
            // 24 hours did not pass since the last run
            return;
        }

        const allPoolDataRows: string[][] = [];
        const allPoolCompositionRows: string[][] = [];
        const allEmissionDataRows: string[][] = [];
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
                categories: true,
                staking: {
                    include: {
                        farm: { include: { rewarders: true } },
                        gauge: { include: { rewards: true } },
                    },
                },
            },
        });

        const endOfYesterday = moment.tz('GMT').endOf('day').subtract(1, 'day');
        const endOfDayBeforeYesterday = moment.tz('GMT').endOf('day').subtract(2, 'day').unix();

        for (const pool of pools) {
            let sharesChange = `0`;
            let tvlChange = `0`;
            let lpSwapFee = `0`;
            let protocolSwapFee = `0`;
            let dailySwaps = `0`;

            let lastTotalSwaps = `0`;
            //find last entry of pool in currentSheet and get total swaps. If no previous value present, set previous value to 0
            if (currentSheetValues.data.values) {
                // string[row][column], index 1 is address, index 5 total swap count
                currentSheetValues.data.values.forEach((row: string[]) => {
                    if (pool.address === row[1] && endOfDayBeforeYesterday.toString() === row[0]) {
                        lastTotalSwaps = row[5];
                    }
                });
            }

            if (pool.dynamicData) {
                sharesChange = `${
                    parseFloat(pool.dynamicData.totalShares) - parseFloat(pool.dynamicData.totalShares24hAgo)
                }`;
                tvlChange = `${pool.dynamicData.totalLiquidity - pool.dynamicData.totalLiquidity24hAgo}`;
                lpSwapFee = `${pool.dynamicData.fees24h * (1 - this.swapProtocolFeePercentage)}`;
                protocolSwapFee = `${pool.dynamicData.fees24h * this.swapProtocolFeePercentage}`;

                dailySwaps = `${pool.dynamicData.swapsCount - parseFloat(lastTotalSwaps)}`;
            }

            const swapFee = pool.dynamicData?.swapFee || `0`;

            const blacklisted = pool.categories.find((category) => category.category === 'BLACK_LISTED');

            // add pool data
            allPoolDataRows.push([
                endOfYesterday.format('DD MMM YYYY'),
                `${endOfYesterday.unix()}`,
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
                blacklisted ? 'yes' : 'no',
            ]);

            const allTokens = pool.allTokens.map((token) => {
                const poolToken = pool.tokens.find((poolToken) => poolToken.address === token.token.address);

                return {
                    ...token.token,
                    weight: poolToken?.dynamicData?.weight,
                };
            });

            // add pool composition data
            for (const token of allTokens) {
                allPoolCompositionRows.push([
                    token.address,
                    token.name,
                    pool.id,
                    pool.address,
                    token.symbol,
                    token.weight ? token.weight : `0`,
                    pool.name,
                ]);
            }

            // add emission data
            if (pool.staking) {
                const blocksPerDay = await blocksSubgraphService.getBlocksPerDay();
                const tokenPrices = await tokenService.getTokenPrices();
                const beetsPrice = await beetsService.getBeetsPrice();
                if (pool.staking.farm) {
                    const beetsPerDay = parseFloat(pool.staking.farm.beetsPerBlock) * blocksPerDay;
                    const beetsValuePerDay = parseFloat(beetsPrice) * beetsPerDay;
                    if (beetsPerDay > 0) {
                        allEmissionDataRows.push([
                            endOfYesterday.format('DD MMM YYYY'),
                            `${endOfYesterday.unix()}`,
                            pool.address,
                            pool.name,
                            'BEETS',
                            networkConfig.beets.address,
                            `${beetsPerDay}`,
                            `${beetsValuePerDay}`,
                        ]);
                    }
                    if (pool.staking.farm.rewarders) {
                        for (const rewarder of pool.staking.farm.rewarders) {
                            const rewardToken = await tokenService.getToken(rewarder.tokenAddress);
                            if (!rewardToken) {
                                continue;
                            }
                            const rewardsPerDay = parseFloat(rewarder.rewardPerSecond) * secondsPerDay;
                            const rewardsValuePerDay =
                                tokenService.getPriceForToken(tokenPrices, rewarder.tokenAddress) * rewardsPerDay;
                            if (rewardsPerDay > 0) {
                                allEmissionDataRows.push([
                                    endOfYesterday.format('DD MMM YYYY'),
                                    `${endOfYesterday.unix()}`,
                                    pool.address,
                                    pool.name,
                                    rewardToken.symbol,
                                    rewardToken.address,
                                    `${rewardsPerDay}`,
                                    `${rewardsValuePerDay}`,
                                ]);
                            }
                        }
                    }
                }
                if (pool.staking.gauge) {
                    for (const reward of pool.staking.gauge.rewards) {
                        const rewardToken = await tokenService.getToken(reward.tokenAddress);
                        if (!rewardToken) {
                            continue;
                        }
                        const rewardsPerDay = parseFloat(reward.rewardPerSecond) * secondsPerDay;
                        const rewardsValuePerDay =
                            tokenService.getPriceForToken(tokenPrices, reward.tokenAddress) * rewardsPerDay;
                        if (rewardsPerDay > 0) {
                            allEmissionDataRows.push([
                                endOfYesterday.format('DD MMM YYYY'),
                                `${endOfYesterday.unix()}`,
                                pool.address,
                                pool.name,
                                rewardToken.symbol,
                                rewardToken.address,
                                `${rewardsPerDay}`,
                                `${rewardsValuePerDay}`,
                            ]);
                        }
                    }
                }
            }
        }

        console.log(`Appending ${allPoolDataRows.length} rows to ${this.databaseTabName}.`);

        this.appendDataInSheet(this.databaseTabName, 'A1:T1', allPoolDataRows, jwtClient);

        console.log(`Updating ${allPoolCompositionRows.length} rows to ${this.compositionTabName}.`);

        this.updateDataInSheet(
            this.compositionTabName,
            `A2:G${allPoolCompositionRows.length + 1}`,
            allPoolCompositionRows,
            jwtClient,
        );

        console.log(`Appending ${allEmissionDataRows.length} rows to ${this.emissionDataTabName}.`);

        this.appendDataInSheet(this.emissionDataTabName, 'A1:H1', allEmissionDataRows, jwtClient);
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
    networkConfig.datastudio[env.DEPLOYMENT_ENV as DeploymentEnv].emissionDataTabName,
    networkConfig.balancer.swapProtocolFeePercentage,
);
