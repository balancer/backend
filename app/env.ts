import { EnvType, load } from 'ts-dotenv';
import { resolve } from 'path';

type Env = EnvType<typeof schema>;

export const schema = {
    PORT: Number,
    NODE_ENV: String,
    DEFAULT_CHAIN_ID: String,
    DEPLOYMENT_ENV: String,
    ADMIN_API_KEY: String,
    SANITY_API_TOKEN: String,
    SENTRY_DSN: String,
    SENTRY_AUTH_TOKEN: String,
    AWS_REGION: String,
    PROTOCOL: {
        optional: true,
        type: String,
    },
    GROVE_CITY: {
        optional: true,
        type: String,
    },
    INFURA_API_KEY: {
        optional: true,
        type: String,
    },
    GATEWAYFM_API_KEY: {
        optional: true,
        type: String,
    },
    ALCHEMY_API_KEY: {
        optional: true,
        type: String,
    },
    COINGECKO_API_KEY: {
        optional: true,
        type: String,
    },
    WORKER_QUEUE_URL: {
        optional: true,
        type: String,
    },
    DATABASE_URL: String,
};

export const env: Env = load(schema, {
    path: resolve(__dirname, `../../.env`),
    overrideProcessEnv: true,
});
