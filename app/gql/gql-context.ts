import { Hub } from '@sentry/node';

export interface Context {
    accountAddress: string | null;
    adminApiKey: string | null;
    transaction: ReturnType<Hub['startTransaction']>;
}
