import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { env } from '../../app/env';
import { prisma } from './prisma-client';

Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: true,
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        // @ts-ignore
        new Tracing.Integrations.Prisma({ prisma }),
    ],
});

export const sentry = Sentry;
