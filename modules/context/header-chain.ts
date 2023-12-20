import { getRequestScopeContextValue } from '../context/request-scoped-context';
import { Chain } from '@prisma/client';

const chainIdToChain: { [id: string]: Chain } = {
    '1': Chain.MAINNET,
    '10': Chain.OPTIMISM,
    '100': Chain.GNOSIS,
    '137': Chain.POLYGON,
    '250': Chain.FANTOM,
    '1101': Chain.ZKEVM,
    '8453': Chain.BASE,
    '42161': Chain.ARBITRUM,
    '43114': Chain.AVALANCHE,
}

export const chainToChainId: { [chain: string]: string } = {
    [Chain.MAINNET]: '1',
    [Chain.OPTIMISM]: '10',
    [Chain.GNOSIS]: '100',
    [Chain.POLYGON]: '137',
    [Chain.FANTOM]: '250',
    [Chain.ZKEVM]: '1101',
    [Chain.BASE]: '8453',
    [Chain.ARBITRUM]: '42161',
    [Chain.AVALANCHE]: '43114',
};

/**
 * Setup to transition out from the old header-based chainIDs to the new required chain query filters.
 * 
 * @returns The chain of the current request, if any.
 */
export const headerChain = (): Chain | undefined => {
    const chainId = getRequestScopeContextValue<string>('chainId');
    
    if (chainId) {
        return chainIdToChain[chainId];
    }

    return undefined;
}
