import * as Sentry from '@sentry/node';
import { Hub } from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

declare global {
    namespace Express {
        interface Context {
            transaction: ReturnType<Hub['startTransaction']>;
        }

        interface Request {
            context: Context;
        }
    }
}

export async function contextMiddleware(req: Request, res: Response, next: NextFunction) {
    const transaction = Sentry.startTransaction({
        // op: 'gql',
        name: 'GraphQLTransaction', // this will be the default name, unless the gql query has a name
    });
    Sentry.configureScope((scope) => {
        scope.setSpan(transaction);
    });

    // @ts-ignore
    req.context = { transaction };

    next();
}
