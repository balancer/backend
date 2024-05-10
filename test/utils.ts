import { randomBytes } from 'crypto';

export function createRandomAddress() {
    return '0x' + randomBytes(32).toString('hex');
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
