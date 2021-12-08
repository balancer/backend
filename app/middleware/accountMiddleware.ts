import { NextFunction, Request, Response } from 'express';
import { getHeader } from '../util/getHeader';

declare global {
    namespace Express {
        interface Context {
            accountAddress: string | null;
            adminApiKey: string | null;
        }
    }
}

export async function accountMiddleware(req: Request, res: Response, next: NextFunction) {
    const accountAddress = getHeader(req, 'AccountAddress');
    const adminApiKey = getHeader(req, 'AdminApiKey');

    req.context.accountAddress = accountAddress ? accountAddress.toLowerCase() : null;
    req.context.adminApiKey = adminApiKey ?? null;

    next();
}
