import { getRequestScopeContextValue } from '../context/request-scoped-context';
import { Chain } from '@prisma/client';
import { chainIdToChain } from '../network/chain-id-to-chain';

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
};
