import { EnvType, load } from 'ts-dotenv';
import { resolve } from 'path';

type Env = EnvType<typeof schema>;

export const schema = {
    REDIS_URL: String,
    REDIS_PORT: Number,
    PORT: Number,
    NODE_ENV: String,
    BALANCER_SUBGRAPH: String,
    MASTERCHEF_SUBGRAPH: String,
    BLOCKS_SUBGRAPH: String,
    CHAIN_ID: String,
    CHAIN_SLUG: String,
    NATIVE_ASSET_ADDRESS: String,
    WRAPPED_NATIVE_ASSET_ADDRESS: String,
    COINGECKO_NATIVE_ASSET_ID: String,
    COINGECKO_PLATFORM_ID: String,
    BEETS_ADDRESS: String,
    SUBGRAPH_START_DATE: String,
};

export const env: Env = load(schema, {
    path: resolve(__dirname, '../.env'),
    overrideProcessEnv: process.env.NODE_ENV !== 'production',
});
