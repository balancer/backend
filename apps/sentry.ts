import { initApiSentry } from './api/sentry';
import { initWorkerSentry } from './worker/sentry';
import { initSchedulerSentry } from './scheduler/sentry';

if (process.env.WORKER === 'true') {
    initWorkerSentry();
} else if (process.env.SCHEDULER === 'true') {
    initSchedulerSentry();
} else {
    initApiSentry();
}
