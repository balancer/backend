import { randomBytes } from 'crypto';

export function createRandomAddress() {
    return '0x' + randomBytes(32).toString('hex');
}
