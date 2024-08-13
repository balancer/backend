import { Chain, PrismaPoolType } from '@prisma/client';
import { PoolType } from '../subgraphs/balancer-v3-pools/generated/types';
import { StableData } from '../../pool/subgraph-mapper';
import { fx, gyro, element, stable } from '../../pool/pool-data';
import { JoinedSubgraphPool } from '../subgraphs';
import { zeroAddress } from 'viem';

export const hookTransformer = (poolData: JoinedSubgraphPool, chain: Chain) => {
    // By default v3 pools have a hook config with the address 0x0
    // We don't want to store this in the database because it's not doing anything
    const hookConfig =
        poolData.hookConfig && poolData.hookConfig.hook.address !== zeroAddress ? poolData.hookConfig : undefined;

    if (!hookConfig) {
        return undefined;
    }

    const { hook, ...hookFlags } = hookConfig;

    return {
        address: hook.address.toLowerCase(),
        chain: chain,
        ...hookFlags,
    };
};
