import Safe, { ContractNetworksConfig, EthersAdapter } from '@gnosis.pm/safe-core-sdk';
import { ethers, providers } from 'ethers';
import { env } from '../../app/env';
import { cache } from '../cache/cache';
import { getAddress } from 'ethers/lib/utils';
import { Cache, CacheClass } from 'memory-cache';
import { GraphQLClient } from 'graphql-request';

const CACHE_KEY_PREFIX = 'gnosis-address-is-multisig_';
const TIMEOUT = 2592000; //30 days

const contractNetworks: ContractNetworksConfig = {
    250: {
        safeProxyFactoryAddress: '0xc3C41Ab65Dabe3ae250A0A1FE4706FdB7ECEB951',
        multiSendAddress: '0xd1b160Ee570632ac402Efb230d720669604918e8',
        safeMasterCopyAddress: '0x87EB227FE974e9E1d3Bc4Da562e0Bd3C348c2B34',
    },
};

export async function isAddressGnosisSafe(address: string) {
    const key = `${CACHE_KEY_PREFIX}${address}`;
    const cachedValue = await cache.getValue(key);

    if (cachedValue) {
        return cachedValue === 'true';
    }

    try {
        await Safe.create({
            ethAdapter: await getAdapter(),
            safeAddress: getAddress(address),
            contractNetworks,
        });

        await cache.putValue(key, 'true', TIMEOUT);
        return true;
    } catch {
        await cache.putValue(key, 'false', TIMEOUT);
        return false;
    }
}

async function getAdapter() {
    const provider = new providers.JsonRpcProvider(env.RPC_URL);
    const signer = ethers.Wallet.createRandom();

    return new EthersAdapter({
        ethers,
        signer: signer.connect(provider),
    });
}
