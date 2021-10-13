import moment from 'moment-timezone';
import { TIMEZONE } from '../../projectConfig';

export function momentTz(): moment.Moment;
export function momentTz(dateTime?: Date): moment.Moment;
export function momentTz(dateTime?: string): moment.Moment;
export function momentTz(dateTime: string, format: string): moment.Moment;
export function momentTz(dateTime?: string | Date, format?: string): moment.Moment {
    if (format && typeof dateTime === 'string') {
        return moment.tz(dateTime, format, TIMEZONE);
    }

    if (dateTime) {
        return moment.tz(dateTime, TIMEZONE);
    }

    return moment.tz(TIMEZONE);
}

export function parseMomentTz(dateTimeString: string, formatString: string) {
    return moment.tz(dateTimeString, formatString, TIMEZONE);
}

export function getTodaysDate() {
    return momentTz().format('YYYY-MM-DD');
}

export function getNowMoment() {
    return momentTz();
}

export function isDateStringOfFormat(dateString: string, format: string) {
    return moment(dateString, format, true).isValid();
}
