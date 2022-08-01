import { Hub } from '@sentry/hub/types/hub';

export interface Context {
    accountAddress: string | null;
    adminApiKey: string | null;
    transaction: ReturnType<Hub['startTransaction']>;
}
