import SanityClient from '@sanity/client';
import { env } from '../../app/env';

export const sanityClient = SanityClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    apiVersion: '2021-12-15',
    token: env.SANITY_API_TOKEN,
    useCdn: false,
});
