import * as Sentry from '@sentry/node';
import { Hub } from '@sentry/node';
import { NextFunction, Request, Response } from 'express';
import { networkContext } from '../../modules/network/network-context.service';
import { initRequestScopedContext, setRequestScopedContextValue } from '../../modules/context/request-scoped-context';

declare global {
    namespace Express {
        interface Context {
            accountAddress: string | null;
            adminApiKey: string | null;
            chainId: string | null;
            transaction: ReturnType<Hub['startTransaction']>;
        }
    }
}

function getHeader(req: Request, key: string): string | undefined {
    const value = req.headers[key.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
    const accountAddress = getHeader(req, 'AccountAddress');
    const adminApiKey = getHeader(req, 'AdminApiKey');
    const chainId = getHeader(req, 'ChainId');

    req.context.accountAddress = accountAddress ? accountAddress.toLowerCase() : null;
    req.context.adminApiKey = adminApiKey ?? null;
    req.context.chainId = chainId ?? null;

    Sentry.setUser({ id: accountAddress?.toLowerCase() });

    if (chainId && networkContext.isValidChainId(chainId)) {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        next();
    } else {
        next();
    }
}
