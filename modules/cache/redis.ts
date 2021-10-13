import { createNodeRedisClient } from 'handy-redis';
import { env } from '../../app/env';

export const redis = createNodeRedisClient({
    host: env.REDIS_URL,
    port: env.REDIS_PORT,
});
