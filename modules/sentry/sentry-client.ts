import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { env } from '../../app/env';
import { prisma } from '../prisma/prisma-client';

Sentry.init({
    dsn: `https://${env.SENTRY_KEY}@o1267521.ingest.sentry.io/6454017`,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // @ts-ignore
        new Tracing.Integrations.Prisma({ prisma }),
    ],
});

export const sentry = Sentry;
