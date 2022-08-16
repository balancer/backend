import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { timestampRoundedUpToNearestHour } from '../../common/time';
import { CoingeckoService } from '../../coingecko/coingecko.service';

export class CoingeckoDataService {
    constructor(private readonly conigeckoService: CoingeckoService) {}

    public async syncTokenDynamicDataFromCoingecko() {
        const tokensWithIds = await prisma.prismaToken.findMany({
            where: { coingeckoTokenId: { not: null } },
            orderBy: { dynamicData: { updatedAt: 'asc' } },
        });

        const chunks = _.chunk(tokensWithIds, 100);

        for (const chunk of chunks) {
            const response = await this.conigeckoService.getMarketDataForTokenIds(
                chunk.map((item) => item.coingeckoTokenId || ''),
            );
            let operations: any[] = [];

            for (const item of response) {
                const token = tokensWithIds.find((token) => token.coingeckoTokenId === item.id);

                if (!token) {
                    continue;
                }

                if (moment(item.last_updated).isAfter(moment().subtract(10, 'minutes'))) {
                    const data = {
                        price: item.current_price,
                        ath: item.ath,
                        atl: item.atl,
                        marketCap: item.market_cap,
                        fdv: item.fully_diluted_valuation,
                        high24h: item.high_24h ?? undefined,
                        low24h: item.low_24h ?? undefined,
                        priceChange24h: item.price_change_24h ?? undefined,
                        priceChangePercent24h: item.price_change_percentage_24h,
                        priceChangePercent7d: item.price_change_percentage_7d_in_currency,
                        priceChangePercent14d: item.price_change_percentage_14d_in_currency,
                        priceChangePercent30d: item.price_change_percentage_30d_in_currency,
                        updatedAt: item.last_updated,
                    };

                    operations.push(
                        prisma.prismaTokenDynamicData.upsert({
                            where: { tokenAddress: token.address },
                            update: data,
                            create: {
                                coingeckoId: item.id,
                                tokenAddress: token.address,
                                ...data,
                            },
                        }),
                    );
                }
            }

            await Promise.all(operations);
        }
    }

    public async initChartData(tokenAddress: string) {
        const latestTimestamp = timestampRoundedUpToNearestHour();
        tokenAddress = tokenAddress.toLowerCase();

        const operations: any[] = [];
        const token = await prisma.prismaToken.findUnique({ where: { address: tokenAddress } });

        if (!token || !token.coingeckoTokenId) {
            throw new Error('Missing token or token is missing coingecko token id');
        }

        const monthData = await this.conigeckoService.getCoinCandlestickData(token.coingeckoTokenId, 30);
        const twentyFourHourData = await this.conigeckoService.getCoinCandlestickData(token.coingeckoTokenId, 1);

        //merge 30 min data into hourly data
        const hourlyData = Object.values(
            _.groupBy(twentyFourHourData, (item) => timestampRoundedUpToNearestHour(moment.unix(item[0] / 1000))),
        ).map((hourData) => {
            if (hourData.length === 1) {
                const item = hourData[0];
                item[0] = timestampRoundedUpToNearestHour(moment.unix(item[0] / 1000)) * 1000;

                return item;
            }

            const thirty = hourData[0];
            const hour = hourData[1];

            return [hour[0], thirty[1], Math.max(thirty[2], hour[2]), Math.min(thirty[3], hour[3]), hour[4]];
        });

        operations.push(prisma.prismaTokenPrice.deleteMany({ where: { tokenAddress } }));

        operations.push(
            prisma.prismaTokenPrice.createMany({
                data: monthData
                    .filter((item) => item[0] / 1000 <= latestTimestamp)
                    .map((item) => ({
                        tokenAddress,
                        timestamp: item[0] / 1000,
                        open: item[1],
                        high: item[2],
                        low: item[3],
                        close: item[4],
                        price: item[4],
                        coingecko: true,
                    })),
            }),
        );

        operations.push(
            prisma.prismaTokenPrice.createMany({
                data: hourlyData.map((item) => ({
                    tokenAddress,
                    timestamp: Math.floor(item[0] / 1000),
                    open: item[1],
                    high: item[2],
                    low: item[3],
                    close: item[4],
                    price: item[4],
                    coingecko: true,
                })),
                skipDuplicates: true,
            }),
        );

        await prismaBulkExecuteOperations(operations, true);
    }
}
