import SanityClient from '@sanity/client';
import { env } from '../../app/env';
import { networkContext } from '../network/network-context.service';

export function getSanityClient() {
    return SanityClient({
        projectId: networkContext.data.sanity.projectId,
        dataset: networkContext.data.sanity.dataset,
        apiVersion: '2021-12-15',
        token: env.SANITY_API_TOKEN,
        useCdn: false,
    });
}
