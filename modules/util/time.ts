import moment from 'moment-timezone';

export const oneMinuteInSeconds = 60;
export const fiveMinutesInSeconds = oneMinuteInSeconds * 5;

export const oneSecondInMs = 1000;
export const oneMinInMs = 60 * oneSecondInMs;
export const oneHourInMs = 60 * oneMinInMs;

export const twentyFourHoursInMs = 24 * oneHourInMs;
export const twentyFourHoursInSecs = twentyFourHoursInMs / oneSecondInMs;

export const timeNowInMs = Math.floor(Date.now() / oneSecondInMs);

export function getDailyTimestampRanges(numDays: number): [number, number][] {
    const timestamps: [number, number][] = [];
    const endTime = moment().subtract(numDays, 'days').startOf('day');
    let current = moment().endOf('day');

    while (current.isAfter(endTime)) {
        timestamps.push([current.clone().startOf('day').unix(), current.unix()]);

        current = current.subtract(1, 'day');
    }

    return timestamps;
}

export function getHourlyTimestamps(startTimestamp: number, endTimestamp: number): number[] {
    let current = moment.unix(startTimestamp);
    const timestamps: number[] = [];

    while (current.unix() < endTimestamp) {
        timestamps.push(current.unix());
        current = current.add(1, 'hour');
    }

    return timestamps;
}
