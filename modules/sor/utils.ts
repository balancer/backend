import { tokenService } from '../token/token.service';
import { Chain } from '@prisma/client';
import { AllNetworkConfigsKeyedOnChain, chainToIdMap } from '../network/network-config';
import { GqlSorGetSwapPaths, GqlSorGetSwapsResponse, GqlSorSwapType } from '../../schema';
import { replaceZeroAddressWithEth } from '../web3/addresses';
import { Address } from 'viem';
import { Token, TokenAmount } from '@balancer/sdk';

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
    if (tokenAddr === AllNetworkConfigsKeyedOnChain[chain].data.eth.address) {
        return new Token(
            parseFloat(chainToIdMap[chain]),
            AllNetworkConfigsKeyedOnChain[chain].data.weth.address as Address,
            18,
        );
    } else {
        const prismaToken = await tokenService.getToken(tokenAddr, chain);
        if (!prismaToken) throw Error(`Missing token from tokenService ${tokenAddr}`);
        return new Token(parseFloat(chainToIdMap[chain]), prismaToken.address as Address, prismaToken.decimals);
    }
};

export const swapPathsZeroResponse = (tokenIn: string, tokenOut: string): GqlSorGetSwapPaths => {
    return {
        swaps: [],
        paths: [],
        tokenAddresses: [],
        swapType: 'EXACT_IN',
        vaultVersion: 2,
        tokenIn: replaceZeroAddressWithEth(tokenIn),
        tokenOut: replaceZeroAddressWithEth(tokenOut),
        tokenInAmount: '0',
        tokenOutAmount: '0',
        swapAmount: '0',
        swapAmountScaled: '0',
        returnAmount: '0',
        returnAmountScaled: '0',
        effectivePrice: '0',
        effectivePriceReversed: '0',
        routes: [],
        priceImpact: '0',
    };
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
