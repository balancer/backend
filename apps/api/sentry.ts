import { PrismaInstrumentation } from '@prisma/instrumentation';
import * as Sentry from '@sentry/node';
import { env } from '../env';

// Ensure to call this before importing any other modules!
export const initApiSentry = () => {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `api-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        ignoreErrors: [/.*error: Provide.*chain.*param/],
        integrations: [
            Sentry.captureConsoleIntegration({
                levels: ['error', 'warn'],
            }),
            Sentry.prismaIntegration({
                // Override the default instrumentation that Sentry uses
                prismaInstrumentation: new PrismaInstrumentation(),
            }),
        ],

        // Add Tracing by setting tracesSampleRate
        // Send 1% of transactions to Sentry
        tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE || 0.001),

        // Set sampling rate for profiling
        // This is relative to tracesSampleRate
        profilesSampleRate: Number(env.SENTRY_PROFILES_SAMPLE_RATE || 0.001),

        beforeSend(event, hint) {
            const error = hint.originalException;
            if (error?.toString().includes('Unknown token:')) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }
            if (
                error?.toString().includes('SOR: invalid swap amount input') &&
                event.request?.headers &&
                event.request.headers['user-agent'].includes('Python')
            ) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }
            if (error?.toString().includes('No potential swap paths provided')) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }
            if (error?.toString().includes('Variable "$chains" of required type "[GqlChain!]!" was not provided')) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }

            return event;
        },
    });
};
