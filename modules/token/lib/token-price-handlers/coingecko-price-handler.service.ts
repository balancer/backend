import axios from 'axios';
import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import _ from 'lodash';
import { sleep } from '../../../common/promise';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const FIAT_PARAM = 'usd';
const ADDRESSES_PER_REQUEST = 100;

type CoingeckoPriceResponse = {
    [id: string]: { usd: number | undefined };
};

export class CoingeckoPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = true;
    public readonly id = 'CoingeckoPriceHandlerService';

    constructor(
        private readonly nativeAssetId: string,
        private readonly platformId: string,
        private readonly weth: string,
    ) {}

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return tokens
            .filter(
                (token) =>
                    !token.types.includes('BPT') &&
                    !token.types.includes('PHANTOM_BPT') &&
                    !token.types.includes('LINEAR_WRAPPED_TOKEN'),
            )
            .map((token) => token.address);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const nativeAsset = tokens.find((token) => token.address === this.weth);
        const tokensUpdated: string[] = [];

        if (nativeAsset) {
            const price = await this.getNativeAssetPrice();

            if (typeof price === 'undefined') {
                throw new Error('failed to load native asset price');
            }

            await prisma.prismaTokenPrice.upsert({
                where: { tokenAddress_timestamp: { tokenAddress: this.weth, timestamp } },
                update: { price: price, close: price },
                create: {
                    tokenAddress: this.weth,
                    timestamp,
                    price,
                    high: price,
                    low: price,
                    open: price,
                    close: price,
                },
            });

            tokensUpdated.push(this.weth);
        }

        const groupedByPlatform = _.groupBy(
            tokens.map((token) => ({
                address: token.address,
                fetchAddress: token.coingeckoContractAddress || token.address,
                platformId: token.coingeckoPlatformId || this.platformId,
            })),
            (item) => item.platformId,
        );

        for (const platformId of Object.keys(groupedByPlatform)) {
            const groupTokens = groupedByPlatform[platformId];
            const chunks = _.chunk(groupTokens, ADDRESSES_PER_REQUEST);

            for (const chunk of chunks) {
                const response = await this.getPricesForTokenAddresses(
                    chunk.map((item) => item.fetchAddress),
                    platformId,
                );
                let operations: any[] = [];

                for (const item of chunk) {
                    const price = response[item.fetchAddress]?.usd;

                    if (price) {
                        operations.push(
                            prisma.prismaTokenPrice.upsert({
                                where: { tokenAddress_timestamp: { tokenAddress: item.address, timestamp } },
                                update: { price, close: price },
                                create: {
                                    tokenAddress: item.address,
                                    timestamp,
                                    price,
                                    high: price,
                                    low: price,
                                    open: price,
                                    close: price,
                                    coingecko: true,
                                },
                            }),
                        );

                        operations.push(
                            prisma.prismaTokenCurrentPrice.upsert({
                                where: { tokenAddress: item.address },
                                update: { price: price },
                                create: {
                                    tokenAddress: item.address,
                                    timestamp,
                                    price,
                                    coingecko: true,
                                },
                            }),
                        );

                        tokensUpdated.push(item.address);
                    }
                }

                await prisma.$transaction(operations);
                await sleep(200);
            }
        }

        return tokensUpdated;
    }

    private async getNativeAssetPrice(): Promise<number | undefined> {
        const response = await this.get<CoingeckoPriceResponse>(
            `/simple/price?ids=${this.nativeAssetId}&vs_currencies=${FIAT_PARAM}`,
        );

        return response[this.nativeAssetId].usd;
    }

    private async getPricesForTokenAddresses(addresses: string[], platformId: string): Promise<CoingeckoPriceResponse> {
        const endpoint = `/simple/token_price/${platformId}?contract_addresses=${addresses}&vs_currencies=${FIAT_PARAM}`;

        return this.get<CoingeckoPriceResponse>(endpoint);
    }

    private async get<T>(endpoint: string): Promise<T> {
        const { data } = await axios.get(BASE_URL + endpoint);
        return data;
    }
}
