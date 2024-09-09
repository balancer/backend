import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from '../env';

// Ensure to call this before importing any other modules!
export const initWorkerSentry = () => {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `worker-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            nodeProfilingIntegration(),
            Sentry.captureConsoleIntegration({
                levels: ['error', 'warn'],
            }),
        ],

        // Add Tracing by setting tracesSampleRate
        // We recommend adjusting this value in production
        tracesSampleRate: 0.005,

        // Set sampling rate for profiling
        // This is relative to tracesSampleRate
        profilesSampleRate: 0.001,

        beforeSend: (event) => {
            if (event.tags?.job && event.tags?.chain) {
                const exception = event.exception?.values?.[0];

                // Set fingerprint to group errors by job, chain and error
                event.fingerprint = [
                    String(event.tags?.job),
                    String(event.tags?.chain),
                    String(exception?.type),
                    String(exception?.value),
                ];
            }

            return event;
        },
    });
};
