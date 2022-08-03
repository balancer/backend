import { env } from '../../app/env';
import { createClient } from 'redis';

export const redis = createClient();
