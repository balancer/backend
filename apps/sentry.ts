import { initApiSentry } from './api/sentry';
import { initWorkerSentry } from './worker/sentry';
import { initSchedulerSentry } from './scheduler/sentry';
import { initSorSentry } from './sor/sentry';

if (process.env.SOR_INSTANCE === 'true') {
    initSorSentry();
} else if (process.env.WORKER === 'true') {
    initWorkerSentry();
} else if (process.env.SCHEDULER === 'true') {
    initSchedulerSentry();
} else {
    initApiSentry();
}
