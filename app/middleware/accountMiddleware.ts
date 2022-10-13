import * as Sentry from '@sentry/node';
import { Hub } from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

declare global {
    namespace Express {
        interface Context {
            accountAddress: string | null;
            adminApiKey: string | null;
            transaction: ReturnType<Hub['startTransaction']>;
        }
    }
}

function getHeader(req: Request, key: string): string | undefined {
    const value = req.headers[key.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export async function accountMiddleware(req: Request, res: Response, next: NextFunction) {
    const accountAddress = getHeader(req, 'AccountAddress');
    const adminApiKey = getHeader(req, 'AdminApiKey');

    req.context.accountAddress = accountAddress ? accountAddress.toLowerCase() : null;
    req.context.adminApiKey = adminApiKey ?? null;

    Sentry.setUser({ id: accountAddress?.toLowerCase() });

    next();
}
