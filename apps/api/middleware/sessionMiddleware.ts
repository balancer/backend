import { NextFunction, Request, Response } from 'express';
import {
    initRequestScopedContext,
    setRequestScopedContextValue,
} from '../../../modules/context/request-scoped-context';
import { AllNetworkConfigs } from '../../../modules/network/network-config';

function getHeader(req: Request, key: string): string | undefined {
    const value = req.headers[key.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
    const chainId = getHeader(req, 'ChainId');

    if (chainId && isValidChainId(chainId)) {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', chainId);

        next();
    } else {
        next();
    }
}

function isValidChainId(chainId: string) {
    return !!AllNetworkConfigs[chainId];
}
