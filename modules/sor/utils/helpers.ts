import { tokenService } from '../../token/token.service';
import { Chain } from '@prisma/client';
import { chainToChainId as chainToIdMap } from '../../network/chain-id-to-chain';
import { GqlSorGetSwapPaths } from '../../../apps/api/gql/generated-schema';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { Address } from 'viem';
import { Token, TokenAmount } from '@balancer/sdk';
import config from '../../../config';

export async function getTokenAmountHuman(tokenAddr: string, humanAmount: string, chain: Chain): Promise<TokenAmount> {
    const token = await getToken(tokenAddr, chain);
    return TokenAmount.fromHumanAmount(token, humanAmount as `${number}`);
}

export async function getTokenAmountRaw(tokenAddr: string, rawAmount: string, chain: Chain): Promise<TokenAmount> {
    const token = await getToken(tokenAddr, chain);
    return TokenAmount.fromRawAmount(token, rawAmount);
}

/**
 * Gets a b-sdk Token based off tokenAddr.
 * @param address
 * @param chain
 * @returns
 */
export const getToken = async (tokenAddr: string, chain: Chain): Promise<Token> => {
    if (tokenAddr === config[chain].eth.address) {
        return new Token(parseFloat(chainToIdMap[chain]), config[chain].weth.address as Address, 18);
    } else {
        const prismaToken = await tokenService.getToken(tokenAddr, chain);
        if (!prismaToken) throw Error(`Missing token from tokenService ${tokenAddr}`);
        return new Token(parseFloat(chainToIdMap[chain]), prismaToken.address as Address, prismaToken.decimals);
    }
};

export const swapPathsZeroResponse = (tokenIn: string, tokenOut: string, chain: Chain): GqlSorGetSwapPaths => {
    return {
        swaps: [],
        paths: [],
        tokenAddresses: [],
        swapType: 'EXACT_IN',
        vaultVersion: 2,
        protocolVersion: 2,
        tokenIn: replaceZeroAddressWithEth(tokenIn, chain),
        tokenOut: replaceZeroAddressWithEth(tokenOut, chain),
        tokenInAmount: '0',
        tokenOutAmount: '0',
        swapAmount: '0',
        swapAmountRaw: '0',
        returnAmount: '0',
        returnAmountRaw: '0',
        effectivePrice: '0',
        effectivePriceReversed: '0',
        routes: [],
        priceImpact: {
            error: 'No swaps found',
        },
    };
};
