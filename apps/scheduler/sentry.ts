import * as Sentry from '@sentry/node';
import { env } from '../env';

export const initSchedulerSentry = () => {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `scheduler-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            Sentry.captureConsoleIntegration({
                levels: ['error', 'warn'],
            }),
        ],
    });
};
