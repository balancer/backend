import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import moment from 'moment-timezone';
import { networkContext } from '../../../network/network-context.service';
import _ from 'lodash';

export class FallbackHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FallbackHandlerService';

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return tokens
            .filter(
                (token) =>
                    !token.types.includes('BPT') &&
                    !token.types.includes('PHANTOM_BPT') &&
                    !token.types.includes('LINEAR_WRAPPED_TOKEN') &&
                    (!token.coingeckoTokenId ||
                        networkContext.data.coingecko.excludedTokenAddresses.includes(token.address)),
            )
            .map((token) => token.address);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        return [];
    }
}
