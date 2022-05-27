import { MetricPublisher } from '../modules/util/metrics.client';

class CronTimeMetric extends MetricPublisher {
    constructor() {
        super('Crons', 'Backend/CronTime');
    }
}

const createCronTimeMetric = (): CronTimeMetric => {
    return new CronTimeMetric();
};

const cronTimeMetric: MetricPublisher = createCronTimeMetric();

export default cronTimeMetric;
