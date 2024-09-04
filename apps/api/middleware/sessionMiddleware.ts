import { NextFunction, Request, Response } from 'express';
import { networkContext } from '../../../modules/network/network-context.service';
import {
    initRequestScopedContext,
    setRequestScopedContextValue,
} from '../../../modules/context/request-scoped-context';

function getHeader(req: Request, key: string): string | undefined {
    const value = req.headers[key.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
    const chainId = getHeader(req, 'ChainId');

    if (chainId && networkContext.isValidChainId(chainId)) {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        next();
    } else {
        next();
    }
}
