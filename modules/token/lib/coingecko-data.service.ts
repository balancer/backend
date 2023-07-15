import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { timestampRoundedUpToNearestHour } from '../../common/time';
import { CoingeckoService } from '../../coingecko/coingecko.service';
import { networkContext } from '../../network/network-context.service';
import { AllNetworkConfigs } from '../../network/network-config';
import { PrismaToken } from '.prisma/client';

export class CoingeckoDataService {
    constructor(private readonly conigeckoService: CoingeckoService) {}

    public async syncCoingeckoPricesForAllChains() {
        const timestamp = timestampRoundedUpToNearestHour();

        const tokensWithIds = await prisma.prismaToken.findMany({
            where: { coingeckoTokenId: { not: null } },
            orderBy: { dynamicData: { updatedAt: 'asc' } },
        });

        // need to filter any excluded tokens from the network configs
        const allNetworkConfigs = Object.keys(AllNetworkConfigs);
        const includedTokensWithIds: PrismaToken[] = [];
        for (const chainId of allNetworkConfigs) {
            const excludedAddresses = AllNetworkConfigs[chainId].data.coingecko.excludedTokenAddresses;
            const chain = AllNetworkConfigs[chainId].data.chain;

            includedTokensWithIds.push(
                ...tokensWithIds.filter(
                    (token) => token.chain === chain.prismaId && !excludedAddresses.includes(token.address),
                ),
            );
        }

        // don't price beets via coingecko for now
        const filteredTokens = includedTokensWithIds.filter((token) => token.coingeckoTokenId !== 'beethoven-x');

        const uniqueTokensWithIds = _.uniqBy(filteredTokens, 'coingeckoTokenId');

        const chunks = _.chunk(uniqueTokensWithIds, 250); //max page size is 250

        for (const chunk of chunks) {
            const response = await this.conigeckoService.getMarketDataForTokenIds(
                chunk.map((item) => item.coingeckoTokenId || ''),
            );
            let operations: any[] = [];

            for (const item of response) {
                const tokensToUpdate = includedTokensWithIds.filter((token) => token.coingeckoTokenId === item.id);
                for (const tokenToUpdate of tokensToUpdate) {
                    // only update if we have a new price and if we have a price at all
                    if (moment(item.last_updated).isAfter(moment().subtract(10, 'minutes')) && item.current_price) {
                        const data = {
                            price: item.current_price,
                            ath: item.ath ?? undefined,
                            atl: item.atl ?? undefined,
                            marketCap: item.market_cap ?? undefined,
                            fdv: item.fully_diluted_valuation ?? undefined,
                            high24h: item.high_24h ?? undefined,
                            low24h: item.low_24h ?? undefined,
                            priceChange24h: item.price_change_24h ?? undefined,
                            priceChangePercent24h: item.price_change_percentage_24h ?? undefined,
                            priceChangePercent7d: item.price_change_percentage_7d_in_currency ?? undefined,
                            priceChangePercent14d: item.price_change_percentage_14d_in_currency ?? undefined,
                            priceChangePercent30d: item.price_change_percentage_30d_in_currency ?? undefined,
                            updatedAt: item.last_updated,
                        };

                        operations.push(
                            prisma.prismaTokenDynamicData.upsert({
                                where: {
                                    tokenAddress_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: data,
                                create: {
                                    coingeckoId: item.id,
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    ...data,
                                },
                            }),
                        );

                        // update current price and price data, for every chain
                        operations.push(
                            prisma.prismaTokenPrice.upsert({
                                where: {
                                    tokenAddress_timestamp_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        timestamp,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: { price: item.current_price, close: item.current_price },
                                create: {
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    timestamp,
                                    price: item.current_price,
                                    high: item.current_price,
                                    low: item.current_price,
                                    open: item.current_price,
                                    close: item.current_price,
                                    coingecko: true,
                                },
                            }),
                        );

                        operations.push(
                            prisma.prismaTokenCurrentPrice.upsert({
                                where: {
                                    tokenAddress_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: { price: item.current_price },
                                create: {
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    timestamp,
                                    price: item.current_price,
                                    coingecko: true,
                                },
                            }),
                        );
                    }
                }
            }

            await Promise.all(operations);
        }
    }

    public async syncCoingeckoIds() {
        const allTokens = await prisma.prismaToken.findMany({});

        const coinIds = await this.conigeckoService.getCoinIdList();

        for (const token of allTokens) {
            const coinId = coinIds.find((coinId) => {
                if (coinId.platforms[networkContext.data.coingecko.platformId]) {
                    return coinId.platforms[networkContext.data.coingecko.platformId].toLowerCase() === token.address;
                }
            });

            if (coinId && token.coingeckoTokenId !== coinId.id) {
                await prisma.prismaToken.update({
                    where: {
                        address_chain: { address: token.address, chain: token.chain },
                    },
                    data: {
                        coingeckoTokenId: coinId.id,
                        coingeckoPlatformId: networkContext.data.coingecko.platformId,
                    },
                });
            }
        }
    }

    public async initChartData(tokenAddress: string) {
        const latestTimestamp = timestampRoundedUpToNearestHour();
        tokenAddress = tokenAddress.toLowerCase();

        const operations: any[] = [];
        const token = await prisma.prismaToken.findUnique({
            where: {
                address_chain: {
                    address: tokenAddress,
                    chain: networkContext.chain,
                },
            },
        });

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

        operations.push(prisma.prismaTokenPrice.deleteMany({ where: { tokenAddress, chain: networkContext.chain } }));

        operations.push(
            prisma.prismaTokenPrice.createMany({
                data: monthData
                    .filter((item) => item[0] / 1000 <= latestTimestamp)
                    .map((item) => ({
                        tokenAddress,
                        chain: networkContext.chain,
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
                    chain: networkContext.chain,
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
