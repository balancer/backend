import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour } from '../../../common/time';
import { CoingeckoService } from '../../../coingecko/coingecko.service';
import { networkContext } from '../../../network/network-context.service';
import { AllNetworkConfigs } from '../../../network/network-config';
import { Chain } from '@prisma/client';
import { add } from 'lodash';

export class CoingeckoPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = true;
    public readonly id = 'CoingeckoPriceHandlerService';

    constructor(private readonly coingeckoService: CoingeckoService) {}

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        const excludedFromCoingecko: { address: string; chain: Chain }[] = [];
        for (const chain in AllNetworkConfigs) {
            const config = AllNetworkConfigs[chain];
            config.data.coingecko.excludedTokenAddresses.forEach((address) =>
                excludedFromCoingecko.push({ address: address, chain: config.data.chain.prismaId }),
            );
        }
        return tokens.filter(
            (token) =>
                !token.types.includes('BPT') &&
                !token.types.includes('PHANTOM_BPT') &&
                !token.types.includes('LINEAR_WRAPPED_TOKEN') &&
                !excludedFromCoingecko.find(
                    (excluded) => excluded.address === token.address && excluded.chain === token.chain,
                ) &&
                !token.excludedFromCoingecko,
        );
    }

    // we update based on coingecko ID first, then the rest we try to update via contract address and platform
    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        const accepedTokens = this.getAcceptedTokens(tokens);
        const timestamp = timestampRoundedUpToNearestHour();
        const timestampMidnight = timestampEndOfDayMidnight();
        const tokensUpdated: PrismaTokenWithTypes[] = [];

        const tokenAddresses = accepedTokens.map((item) => item.address);

        const tokenPricesByAddress = await this.coingeckoService.getTokenPrices(tokenAddresses);

        let operations: any[] = [];
        for (let tokenAddress of Object.keys(tokenPricesByAddress)) {
            const priceUsd = tokenPricesByAddress[tokenAddress].usd;
            const normalizedTokenAddress = tokenAddress.toLowerCase();
            const exists = tokenAddresses.includes(normalizedTokenAddress);
            if (!exists) {
                console.log('skipping token', normalizedTokenAddress);
            }
            if (exists && priceUsd) {
                operations.push(
                    prisma.prismaTokenPrice.upsert({
                        where: {
                            tokenAddress_timestamp_chain: {
                                tokenAddress: normalizedTokenAddress,
                                timestamp,
                                chain: networkContext.chain,
                            },
                        },
                        update: { price: priceUsd, close: priceUsd },
                        create: {
                            tokenAddress: normalizedTokenAddress,
                            chain: networkContext.chain,
                            timestamp,
                            price: priceUsd,
                            high: priceUsd,
                            low: priceUsd,
                            open: priceUsd,
                            close: priceUsd,
                            coingecko: true,
                        },
                    }),
                );

                operations.push(
                    prisma.prismaTokenCurrentPrice.upsert({
                        where: {
                            tokenAddress_chain: { tokenAddress: normalizedTokenAddress, chain: networkContext.chain },
                        },
                        update: { price: priceUsd },
                        create: {
                            tokenAddress: normalizedTokenAddress,
                            chain: networkContext.chain,
                            timestamp,
                            price: priceUsd,
                            coingecko: true,
                        },
                    }),
                );

                tokensUpdated.push(normalizedTokenAddress);
            }
        }

        await Promise.all(operations);

        return tokensUpdated;
    }
}
