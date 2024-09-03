import './sentry';
import { startApiServer } from './api/server';
import { startWorkerServer } from './worker/server';
import { startSchedulerServer } from './scheduler/server';

if (process.env.WORKER === 'true') {
    startWorkerServer();
} else if (process.env.SCHEDULER === 'true') {
    startSchedulerServer();
} else {
    startApiServer();
}
