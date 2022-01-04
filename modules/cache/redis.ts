import { env } from '../../app/env';
import { createClient } from 'redis';

export const redisRead = createClient({ url: `redis://${env.REDIS_URL}:${env.REDIS_PORT}` });
export const redisWrite = createClient({ url: `redis://${env.REDIS_WRITE_URL}:${env.REDIS_WRITE_PORT}` });
