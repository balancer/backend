import { env } from '../../apps/env';
import { ResolverContext } from '../../apps/api/gql/resolver-context';

export function getRequiredAccountAddress(context: ResolverContext) {
    if (!context?.accountAddress) {
        throw new Error('Account address is required');
    }

    return context.accountAddress;
}

export function isAdminRoute(context: ResolverContext) {
    if (!context?.adminApiKey || context.adminApiKey !== env.ADMIN_API_KEY) {
        throw new Error('Missing or invalid admin api key');
    }
}
