import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import { Transaction } from '@sentry/types';
import { NextFunction, Request, Response } from 'express';

declare global {
    namespace Express {
        interface Context {
            transaction: Transaction;
        }
    }
}

export async function sentryMiddleware(req: Request, res: Response, next: NextFunction) {
    req.context.transaction = Sentry.startTransaction({
        op: 'gql',
        name: 'GraphQLTransaction', // this will be the default name, unless the gql query has a name
    });
    next();
}
