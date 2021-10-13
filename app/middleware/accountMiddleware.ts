import { NextFunction, Request, Response } from 'express';
import { getHeader } from '../util/getHeader';

declare global {
    namespace Express {
        interface Context {
            accountAddress: string | null;
        }
    }
}

export async function accountMiddleware(req: Request, res: Response, next: NextFunction) {
    const accountAddress = getHeader(req, 'AccountAddress');

    req.context.accountAddress = accountAddress ? accountAddress.toLowerCase() : null;

    next();
}
