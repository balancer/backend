import moment from 'moment-timezone';

export const oneSecondInMs = 1000;
export const oneMinInMs = 60 * oneSecondInMs;
export const oneHourInMs = 60 * oneMinInMs;

export const twentyFourHoursInMs = 24 * oneHourInMs;
export const twentyFourHoursInSecs = twentyFourHoursInMs / oneSecondInMs;

export const timeNowInMs = Math.floor(Date.now() / oneSecondInMs);

export function getHourlyTimestampRanges(numDays: number): number[] {
    let timestamps: number[] = [];
    const endTime = moment().subtract(numDays, 'days').startOf('day');
    let current = moment().startOf('hour');

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
