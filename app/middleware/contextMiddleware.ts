import { NextFunction, Request, Response } from 'express';

declare global {
    namespace Express {
        interface Context {}

        interface Request {
            context: Context;
        }
    }
}

export async function contextMiddleware(req: Request, res: Response, next: NextFunction) {
    // @ts-ignore
    req.context = {};
    next();
}
