import SanityClient from '@sanity/client';
import { env } from '../../app/env';
import { networkConfig } from '../config/network-config';

export const sanityClient = SanityClient({
    projectId: networkConfig.sanity.projectId,
    dataset: networkConfig.sanity.dataset,
    apiVersion: '2021-12-15',
    token: env.SANITY_API_TOKEN,
    useCdn: false,
});
