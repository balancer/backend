import { TokenAmount, Token, Address, NATIVE_ADDRESS, NATIVE_ASSETS } from '@balancer/sdk';
import { tokenService } from '../token/token.service';
import { Chain } from '@prisma/client';
import { chainToIdMap } from '../network/network-config';
import { GqlSorGetSwapsResponse, GqlSorSwapType } from '../../schema';
import { replaceZeroAddressWithEth } from '../web3/addresses';

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
    const chainId = Number(chainToIdMap[chain]);

    // also check for the polygon native asset
    if (
        (tokenAddr === NATIVE_ADDRESS || tokenAddr === '0x0000000000000000000000000000000000001010') &&
        chainId in NATIVE_ASSETS
    ) {
        return NATIVE_ASSETS[chainId as keyof typeof NATIVE_ASSETS];
    } else {
        const prismaToken = await tokenService.getToken(tokenAddr, chain);
        if (!prismaToken) throw Error(`Missing token from tokenService ${tokenAddr}`);
        return new Token(chainId, prismaToken.address as Address, prismaToken.decimals);
    }
};

export const zeroResponse = (
    swapType: GqlSorSwapType,
    tokenIn: string,
    tokenOut: string,
    swapAmount: string,
): GqlSorGetSwapsResponse => {
    return {
        marketSp: '0',
        tokenAddresses: [],
        swaps: [],
        tokenIn: replaceZeroAddressWithEth(tokenIn),
        tokenOut: replaceZeroAddressWithEth(tokenOut),
        swapType,
        tokenInAmount: swapType === 'EXACT_IN' ? swapAmount : '0',
        tokenOutAmount: swapType === 'EXACT_IN' ? '0' : swapAmount,
        swapAmount: swapType === 'EXACT_IN' ? '0' : swapAmount,
        swapAmountScaled: '0',
        swapAmountForSwaps: '0',
        returnAmount: '0',
        returnAmountScaled: '0',
        returnAmountConsideringFees: '0',
        returnAmountFromSwaps: '0',
        routes: [],
        effectivePrice: '0',
        effectivePriceReversed: '0',
        priceImpact: '0',
    };
};
