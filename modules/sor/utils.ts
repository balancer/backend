import { TokenAmount, Token, Address, NATIVE_ADDRESS, NATIVE_ASSETS } from '@balancer/sdk';
import { tokenService } from '../token/token.service';
import { Chain } from '@prisma/client';
import { chainToIdMap } from '../network/network-config';

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
