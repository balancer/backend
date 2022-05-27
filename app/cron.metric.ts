import { MetricPublisher } from './util/metrics.client';

class CronTimeMetric extends MetricPublisher {
    constructor() {
        super('Backend/CronTime');
    }
}

const createCronTimeMetric = (): CronTimeMetric => {
    return new CronTimeMetric();
};

const cronTimeMetric: MetricPublisher = createCronTimeMetric();

export default cronTimeMetric;
