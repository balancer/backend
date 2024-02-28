import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour } from '../../../common/time';
import { networkContext } from '../../../network/network-context.service';
import { AllNetworkConfigs } from '../../../network/network-config';
import { Chain } from '@prisma/client';
import _ from 'lodash';
import { coingeckoDataService } from '../coingecko-data.service';

export class CoingeckoPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = true;
    public readonly id = 'CoingeckoPriceHandlerService';

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
                !token.excludedFromCoingecko &&
                token.coingeckoTokenId,
        );
    }

    // we update based on coingecko ID
    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        const accepedTokens = this.getAcceptedTokens(tokens);

        const tokensWithCoingeckoIds = accepedTokens.filter((item) => item.coingeckoTokenId);
        const updated = await coingeckoDataService.updatePricesForTokensWithCoingeckoIds(tokensWithCoingeckoIds);

        return updated;
    }
}
