import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';
import { getHeader } from '../util/getHeader';
import { Hub } from '@sentry/hub/types/hub';

declare global {
    namespace Express {
        interface Context {
            accountAddress: string | null;
            adminApiKey: string | null;
            transaction: ReturnType<Hub['startTransaction']>;
        }
    }
}

export async function accountMiddleware(req: Request, res: Response, next: NextFunction) {
    const accountAddress = getHeader(req, 'AccountAddress');
    const adminApiKey = getHeader(req, 'AdminApiKey');

    req.context.accountAddress = accountAddress ? accountAddress.toLowerCase() : null;
    req.context.adminApiKey = adminApiKey ?? null;

    Sentry.setUser({ id: accountAddress?.toLowerCase() });

    next();
}
