import { createNodeRedisClient } from 'handy-redis';
import { env } from '../../app/env';
import { createClient } from 'redis';

export const redis = createClient({ url: `redis://${env.REDIS_URL}:${env.REDIS_PORT}` });

/*
export const redis = createNodeRedisClient({
    host: env.REDIS_URL,
    port: env.REDIS_PORT,
});
*/
