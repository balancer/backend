import { env } from '../../app/env';
import { createClient } from 'redis';

export const redis = createClient({ url: `redis://${env.REDIS_URL}:${env.REDIS_PORT}` });
