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
    SENTRY_TRACES_SAMPLE_RATE: {
        optional: true,
        type: String,
    },
    SENTRY_PROFILES_SAMPLE_RATE: {
        optional: true,
        type: String,
    },
    AWS_REGION: String,
    PROTOCOL: {
        optional: true,
        type: String,
    },
    DRPC_API_KEY: {
        optional: true,
        type: String,
    },
    DRPC_BEETS_API_KEY: {
        optional: true,
        type: String,
    },
    COINGECKO_API_KEY: {
        optional: true,
        type: String,
    },
    THEGRAPH_API_KEY_FANTOM: {
        optional: true,
        type: String,
    },
    THEGRAPH_API_KEY_BALANCER: {
        optional: true,
        type: String,
    },
    WORKER_QUEUE_URL: {
        optional: true,
        type: String,
    },
    DATABASE_URL: String,
    SUPERFORM_API_KEY: {
        optional: true,
        type: String,
    },
    SOR_POOLS_CACHE_TTL_SECONDS: {
        type: String,
        default: '10',
    },
    SOR_SERVICE_URL: {
        type: String,
        default: 'http://sor-internal-75e33c0e4ea5363e.elb.eu-central-1.amazonaws.com/graphql',
    },
    SOR_INSTANCE: {
        type: Boolean,
        default: false,
    },
    PAXOS_APR_KEY: {
        type: String,
        optional: true,
    },
    TOKENLOGIC_API_KEY: {
        type: String,
        optional: true,
    },
    FUUL_HYPURR_API_KEY: {
        type: String,
        optional: true,
    },
    MERKL_API_KEY: {
        type: String,
        optional: true,
    },
    DIRECT_API_KEY: {
        type: String,
        optional: true,
    },
};

export const env: Env = load(schema, {
    path: resolve(__dirname, `../../.env`),
    overrideProcessEnv: true,
});
