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
import { isComposableStablePool, isWeightedPoolV2 } from '../pool/lib/pool-utils';

export class DatastudioService {
    constructor(
        private readonly secretsManager: SecretsManager,
        private readonly jwtClientHelper: GoogleJwtClient,
        private readonly databaseTabName: string,
        private readonly sheetId: string,
        private readonly compositionTabName: string,
        private readonly emissionDataTabName: string,
        private readonly swapProtocolFeePercentage: number,
        private readonly chainSlug: string,
    ) {}

    public async feedPoolData() {
        const privateKey = await this.secretsManager.getSecret('backend-v2-datafeed-privatekey');
        const jwtClient = await this.jwtClientHelper.getAuthorizedSheetsClient(privateKey);

        const sheets = google.sheets({ version: 'v4' });

        const timestampRange = `${this.databaseTabName}!B:B`;
        const poolAddressRange = `${this.databaseTabName}!D:D`;
        const totalSwapRange = `${this.databaseTabName}!J:J`;
        const chainRange = `${this.databaseTabName}!V:V`;
        let currentSheetValues;
        currentSheetValues = await sheets.spreadsheets.values.batchGet({
            auth: jwtClient,
            spreadsheetId: this.sheetId,
            ranges: [timestampRange, poolAddressRange, totalSwapRange, chainRange],
            valueRenderOption: 'UNFORMATTED_VALUE',
        });

        // if there are no values in the sheet, take end of the day before yesterday which means the feed will run now
        let lastRun = moment.tz('GMT').endOf('day').subtract(2, 'day').unix();
        let timestampValues: number[][] = [];
        let poolAddressValues: string[][] = [];
        let totalSwapValues: string[][] = [];
        let chainValues: string[][] = [];
        if (currentSheetValues.data.valueRanges) {
            timestampValues = currentSheetValues.data.valueRanges[0].values || [];
            if (timestampValues[0][0].toString() !== 'Timestamp') {
                throw new Error('Wrong row for timestamp');
            }
            poolAddressValues = currentSheetValues.data.valueRanges[1].values || [];
            if (poolAddressValues[0][0].toString() !== 'address') {
                throw new Error('Wrong row for address');
            }
            totalSwapValues = currentSheetValues.data.valueRanges[2].values || [];
            if (totalSwapValues[0][0].toString() !== 'swapsCount') {
                throw new Error('Wrong row for swapsCount');
            }
            chainValues = currentSheetValues.data.valueRanges[3].values || [];
            if (chainValues[0][0].toString() !== 'chain') {
                throw new Error('Wrong row for chain');
            }
        }

        for (let i = timestampValues.length - 1; i >= 0; i--) {
            if (chainValues[i][0] === this.chainSlug) {
                lastRun = timestampValues[i][0];
                break;
            }
        }

        if (lastRun > moment.tz('GMT').subtract(1, 'day').unix()) {
            // 24 hours did not pass since the last run
            return;
        }

        const now = moment.tz('GMT').unix();

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

            let yesterdaySwapsCount = `0`;
            //find last entry of pool in currentSheet for the correct chain and get total swaps. If no previous value present, set previous value to 0
            for (let i = poolAddressValues.length - 1; i >= 0; i--) {
                if (
                    chainValues[i][0] === this.chainSlug &&
                    poolAddressValues[i][0] === pool.address &&
                    timestampValues[i][0] === endOfDayBeforeYesterday
                ) {
                    yesterdaySwapsCount = totalSwapValues[i][0];
                    break;
                }
            }

            if (pool.dynamicData) {
                sharesChange = `${
                    parseFloat(pool.dynamicData.totalShares) - parseFloat(pool.dynamicData.totalShares24hAgo)
                }`;
                tvlChange = `${pool.dynamicData.totalLiquidity - pool.dynamicData.totalLiquidity24hAgo}`;
                lpSwapFee = `${pool.dynamicData.fees24h * (1 - this.swapProtocolFeePercentage)}`;
                protocolSwapFee = `${pool.dynamicData.fees24h * this.swapProtocolFeePercentage}`;

                dailySwaps = `${pool.dynamicData.swapsCount - parseFloat(yesterdaySwapsCount)}`;
            }

            const swapFee = pool.dynamicData?.swapFee || `0`;

            const blacklisted = pool.categories.find((category) => category.category === 'BLACK_LISTED');
            let poolType = pool.type.toString();
            if (isComposableStablePool(pool)) {
                poolType = 'COMPOSABLE_STABLE';
            }
            if (isWeightedPoolV2(pool)) {
                poolType = 'WEIGHTED_V2';
            }

            // add pool data
            allPoolDataRows.push([
                endOfYesterday.format('DD MMM YYYY'),
                `${endOfYesterday.unix()}`,
                `${now}`,
                pool.address,
                pool.name,
                poolType,
                pool.symbol,
                swapFee,
                pool.dynamicData?.totalLiquidity ? `${pool.dynamicData.totalLiquidity}` : `0`,
                pool.dynamicData?.swapsCount ? `${pool.dynamicData.swapsCount}` : `0`,
                pool.dynamicData?.totalShares ? `${pool.dynamicData.totalShares}` : `0`,
                pool.dynamicData?.lifetimeVolume ? `${pool.dynamicData.lifetimeVolume}` : `0`,
                pool.dynamicData?.lifetimeSwapFees ? `${pool.dynamicData.lifetimeSwapFees}` : `0`,
                tvlChange,
                dailySwaps,
                sharesChange,
                pool.dynamicData?.volume24h ? `${pool.dynamicData.volume24h}` : `0`,
                pool.dynamicData?.fees24h ? `${pool.dynamicData.fees24h}` : `0`,
                lpSwapFee,
                protocolSwapFee,
                blacklisted ? 'yes' : 'no',
                this.chainSlug,
                `1`,
            ]);

            const allTokens = pool.allTokens.map((token) => {
                const poolToken = pool.tokens.find((poolToken) => poolToken.address === token.token.address);

                return {
                    ...token.token,
                    weight: poolToken?.dynamicData?.weight,
                    balance: poolToken?.dynamicData?.balance ? poolToken?.dynamicData?.balance : 'not available',
                };
            });

            // add pool composition data
            for (const token of allTokens) {
                allPoolCompositionRows.push([
                    endOfYesterday.format('DD MMM YYYY'),
                    `${endOfYesterday.unix()}`,
                    `${now}`,
                    pool.address,
                    pool.id,
                    pool.name,
                    token.address,
                    token.name,
                    token.symbol,
                    token.weight ? token.weight : `0`,
                    `${token.balance}`,
                    this.chainSlug,
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
                            `${now}`,
                            pool.address,
                            pool.name,
                            'BEETS',
                            networkConfig.beets.address,
                            `${beetsPerDay}`,
                            `${beetsValuePerDay}`,
                            this.chainSlug,
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
                                    `${now}`,
                                    pool.address,
                                    pool.name,
                                    rewardToken.symbol,
                                    rewardToken.address,
                                    `${rewardsPerDay}`,
                                    `${rewardsValuePerDay}`,
                                    this.chainSlug,
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
                                `${now}`,
                                pool.address,
                                pool.name,
                                rewardToken.symbol,
                                rewardToken.address,
                                `${rewardsPerDay}`,
                                `${rewardsValuePerDay}`,
                                this.chainSlug,
                            ]);
                        }
                    }
                }
            }
        }

        console.log(`Appending ${allPoolDataRows.length} rows to ${this.databaseTabName}.`);

        this.appendDataInSheet(this.databaseTabName, 'A1:W1', allPoolDataRows, jwtClient);

        console.log(`Appending ${allPoolCompositionRows.length} rows to ${this.compositionTabName}.`);

        this.appendDataInSheet(this.compositionTabName, `A1:L1`, allPoolCompositionRows, jwtClient);

        console.log(`Appending ${allEmissionDataRows.length} rows to ${this.emissionDataTabName}.`);

        this.appendDataInSheet(this.emissionDataTabName, 'A1:J1', allEmissionDataRows, jwtClient);
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
            insertDataOption: 'INSERT_ROWS',
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
    networkConfig.chain.slug,
);
