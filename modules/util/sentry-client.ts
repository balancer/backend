import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { env } from '../../app/env';
import { prisma } from './prisma-client';

const client = prisma;

Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: env.NODE_ENV,
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Prisma({ client })],
});

export const sentry = Sentry;
