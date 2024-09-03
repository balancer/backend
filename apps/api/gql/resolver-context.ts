import { Request } from 'express';
import { networkContext } from '../../../modules/network/network-context.service';
import {
    initRequestScopedContext,
    setRequestScopedContextValue,
} from '../../../modules/context/request-scoped-context';

function getHeader(req: Request, key: string): string | undefined {
    const value = req.headers[key.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export interface ResolverContext {
    adminApiKey: string | null;
    chainId: string | null;
    accountAddress: string | null;
}

export async function resolverContext(req: Request) {
    const accountAddress = getHeader(req, 'AccountAddress');
    const adminApiKey = getHeader(req, 'AdminApiKey');
    const chainId = getHeader(req, 'ChainId');

    if (chainId && networkContext.isValidChainId(chainId)) {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);
    }

    // Initialize context if it doesn't exist
    return {
        accountAddress: accountAddress ? accountAddress.toLowerCase() : null,
        adminApiKey: adminApiKey ?? null,
        chainId: chainId ?? null,
    };
}
