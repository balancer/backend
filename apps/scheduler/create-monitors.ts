import { env } from '../env';
import { AllNetworkConfigs } from '../../modules/network/network-config';
import { sleep } from '../../modules/common/promise';
import axios from 'axios';
import { WorkerJob } from '../../modules/network/network-config-types';

type SentryMonitorRetrieve = {
    name: string;
    slug: string;
    type: string;
    config: {
        schedule_type: string;
        schedule: [number, string];
        checkin_margin: number;
        max_runtime: number;
    };
    project: {
        name: string;
    };
};

type SentryMonitorSend = {
    name: string;
    slug: string;
    type: string;
    config: {
        schedule_type: string;
        schedule: [number, string];
        checkin_margin: number;
        max_runtime: number;
    };
    project: string;
};

const SENTRY_BASE_URL = 'https://sentry.io/api/0/organizations/skloon/monitors/';
const SENTRY_PROJECT_NAME = 'backend-v3-balancer';

export async function createMonitors(chainId: string): Promise<void> {
    await createMonitorsIfNotExist(chainId, AllNetworkConfigs[chainId].workerJobs);
}

async function createMonitorsIfNotExist(chainId: string, jobs: WorkerJob[]): Promise<void> {
    const { data: currentMonitors } = await axios.get<SentryMonitorRetrieve[]>(SENTRY_BASE_URL, {
        headers: {
            Authorization: `Bearer ${env.SENTRY_AUTH_TOKEN}`,
        },
    });

    // update or add monitors
    for (const cronJob of jobs) {
        const monitorName = `${cronJob.name}-${chainId}`;
        let monitorSlug = monitorName;
        if (monitorName.length > 50) {
            //slug has 50 chars max length
            monitorSlug = monitorName.slice(monitorName.length - 50, monitorName.length);
        }
        let scheduleInMinutes = cronJob.interval / 1000 / 60;
        if (scheduleInMinutes < 1) {
            scheduleInMinutes = 1;
        }
        const checkinMargin = scheduleInMinutes * 3;
        const maxRuntime = scheduleInMinutes * 5;

        // check if we have that monitor already and need to update
        let foundActiveMonitor = false;
        for (const activeMonitor of currentMonitors) {
            if (activeMonitor.slug === monitorSlug) {
                foundActiveMonitor = true;
                // check if we need to update
                if (
                    activeMonitor.config.schedule[0] !== scheduleInMinutes ||
                    activeMonitor.config.checkin_margin !== checkinMargin ||
                    activeMonitor.config.max_runtime !== maxRuntime
                ) {
                    await updateMonitor({
                        name: monitorName,
                        slug: monitorSlug,
                        type: 'cron_job',
                        config: {
                            schedule_type: 'interval',
                            schedule: [scheduleInMinutes, 'minute'],
                            checkin_margin: checkinMargin,
                            max_runtime: maxRuntime,
                        },
                        project: SENTRY_PROJECT_NAME,
                    });
                }
            }
        }

        if (!foundActiveMonitor) {
            // add new one
            await addMonitor({
                name: monitorName,
                slug: monitorSlug,
                type: 'cron_job',
                config: {
                    schedule_type: 'interval',
                    schedule: [scheduleInMinutes, 'minute'],
                    checkin_margin: checkinMargin,
                    max_runtime: maxRuntime,
                },
                project: SENTRY_PROJECT_NAME,
            });
        }
    }

    for (const activeMonitor of currentMonitors) {
        let keepMonitor = false;
        if (!activeMonitor.name.endsWith(chainId)) {
            // ignore monitors that belong to a different chain
            continue;
        }
        for (const cronJob of jobs) {
            const monitorName = `${cronJob.name}-${chainId}`;
            if (activeMonitor.name === monitorName) {
                keepMonitor = true;
            }
        }
        if (!keepMonitor) {
            await deleteMonitor(activeMonitor.slug);
        }
    }
}

async function addMonitor(monitor: SentryMonitorSend): Promise<void> {
    await axios.post(SENTRY_BASE_URL, monitor, {
        headers: {
            Authorization: `Bearer ${env.SENTRY_AUTH_TOKEN}`,
        },
    });
    sleep(1000);
}

async function updateMonitor(monitor: SentryMonitorSend): Promise<void> {
    await axios.put(SENTRY_BASE_URL + `${monitor.slug}/`, monitor, {
        headers: {
            Authorization: `Bearer ${env.SENTRY_AUTH_TOKEN}`,
        },
    });
    sleep(1000);
}

async function deleteMonitor(monitorSlug: string): Promise<void> {
    await axios.delete(SENTRY_BASE_URL + `${monitorSlug}/`, {
        headers: {
            Authorization: `Bearer ${env.SENTRY_AUTH_TOKEN}`,
        },
    });
    sleep(1000);
}
