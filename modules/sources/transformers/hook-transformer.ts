import { Chain, Prisma } from '@prisma/client';
import { V3JoinedSubgraphPool } from '../subgraphs';
import { zeroAddress } from 'viem';
import config from '../../../config';
import { HookType } from '../../network/network-config-types';

export const hookTransformer = (poolData: V3JoinedSubgraphPool, chain: Chain): Prisma.HookCreateInput | undefined => {
    // By default v3 pools have a hook config with the address 0x0
    // We don't want to store this in the database because it's not doing anything
    const hookConfig =
        poolData.hookConfig && poolData.hookConfig.hook.address !== zeroAddress ? poolData.hookConfig : undefined;

    if (!hookConfig) {
        return undefined;
    }

    const { hook, ...hookFlags } = hookConfig;

    const hookAddresses = config[chain].hooks || {};
    const hookTypes = Object.keys(hookAddresses) as HookType[];
    const mappedHooks = hookTypes.reduce((acc, type: HookType) => {
        const addresses = hookAddresses[type] || [];
        addresses.forEach((address) => {
            acc[address] = type;
        });

        return acc;
    }, {} as Record<string, HookType>);

    if (!mappedHooks[hook.address.toLowerCase()]) {
        console.error(`Unknown hook address ${hook.address} on ${chain}`);
        return undefined;
    }

    return {
        address: hook.address.toLowerCase(),
        chain: chain,
        name: mappedHooks[hook.address.toLowerCase()],
        ...hookFlags,
    };
};
