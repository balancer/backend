import moment from 'moment-timezone';

export const oneMinuteInSeconds = 60;
export const fiveMinutesInSeconds = oneMinuteInSeconds * 5;
export const fiveMinutesInMs = fiveMinutesInSeconds * 1000;

export const oneSecondInMs = 1000;
export const oneMinInMs = 60 * oneSecondInMs;
export const oneHourInMs = 60 * oneMinInMs;

export const thirtyMinInMs = 30 * 60 * oneSecondInMs;
export const twentyFourHoursInMs = 24 * oneHourInMs;
export const twentyFourHoursInSecs = twentyFourHoursInMs / oneSecondInMs;

export const oneDayInMinutes = 60 * 24;
export const thirtyDaysInSeconds = 60 * 60 * 24;
export const thirtyDaysInMinutes = oneDayInMinutes * 30;
export const timeNowInMs = Math.floor(Date.now() / oneSecondInMs);

export const secondsPerDay = 86400;
export const secondsPerYear = secondsPerDay * 365;

export function getDailyTimestampRanges(numDays: number): [number, number][] {
    const timestamps: [number, number][] = [];
    const endTime = moment.tz('GMT').subtract(numDays, 'days').startOf('day');
    let current = moment.tz('GMT').endOf('day');

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

export function getHourlyTimestampsForDays(numDays: number): number[] {
    const timestamps: number[] = [];

    const endTime = moment.tz('GMT').subtract(numDays, 'days').startOf('day');
    let current = moment.tz('GMT').startOf('hour');

    while (current.isAfter(endTime)) {
        timestamps.push(current.unix());

        current = current.subtract(1, 'hour');
    }

    return timestamps;
}

export function getHourlyTimestampsWithBuffer(numDays: number): number[] {
    let timestamps: number[] = [];

    const endTime = moment.tz('GMT').subtract(numDays, 'days').startOf('day');
    let current = moment.tz('GMT').startOf('hour');

    while (current.isAfter(endTime)) {
        timestamps = [
            ...timestamps,
            //we create a buffer of 3 seconds to match on to ensure we get at least one block for this hour
            current.clone().subtract(1, 'second').unix(),
            current.unix(),
            current.clone().add(1, 'second').unix(),
        ];

        current = current.subtract(1, 'hour');
    }

    return timestamps;
}

export function getDailyTimestampsForDays(numDays: number): number[] {
    const timestamps: number[] = [];

    const endTime = moment.tz('GMT').subtract(numDays, 'days').startOf('day');
    let current = moment.tz('GMT').startOf('day');

    while (current.isAfter(endTime)) {
        timestamps.push(current.unix());

        current = current.subtract(1, 'day');
    }

    return timestamps;
}

export function getDailyTimestampsWithBuffer(numDays: number): number[] {
    let timestamps: number[] = [];

    const endTime = moment.tz('GMT').subtract(numDays, 'days').startOf('day');
    let current = moment.tz('GMT').startOf('day');

    while (current.isAfter(endTime)) {
        timestamps = [
            ...timestamps,
            //we create a buffer of 3 seconds to match on to ensure we get at least one block for this hour
            current.clone().subtract(5, 'second').unix(),
            current.clone().subtract(4, 'second').unix(),
            current.clone().subtract(3, 'second').unix(),
            current.clone().subtract(2, 'second').unix(),
            current.clone().subtract(1, 'second').unix(),
            current.unix(),
            current.clone().add(1, 'second').unix(),
            current.clone().add(2, 'second').unix(),
            current.clone().add(3, 'second').unix(),
            current.clone().add(4, 'second').unix(),
            current.clone().add(5, 'second').unix(),
        ];

        current = current.subtract(1, 'day');
    }

    return timestamps;
}
