import { Context } from '../../app/gql/gql-context';
import { env } from '../../app/env';

export function getRequiredAccountAddress(context: Context) {
    if (context.accountAddress === null) {
        throw new Error('Account address is required');
    }

    return context.accountAddress;
}

export function isAdminRoute(context: Context) {
    if (context.adminApiKey === null || context.adminApiKey !== env.ADMIN_API_KEY) {
        throw new Error('Missing or invalid admin api key');
    }
}
