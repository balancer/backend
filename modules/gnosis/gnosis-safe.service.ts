import Safe, { ContractNetworksConfig, EthersAdapter } from '@gnosis.pm/safe-core-sdk';
import { ethers, providers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { networkConfig } from '../config/network-config';
import { Cache } from 'memory-cache';

const CACHE_KEY_PREFIX = 'gnosis-address-is-multisig_';
const TIMEOUT = 2592000; //30 days

const contractNetworks: ContractNetworksConfig = {
    250: {
        safeProxyFactoryAddress: '0xc3C41Ab65Dabe3ae250A0A1FE4706FdB7ECEB951',
        multiSendAddress: '0xd1b160Ee570632ac402Efb230d720669604918e8',
        safeMasterCopyAddress: '0x87EB227FE974e9E1d3Bc4Da562e0Bd3C348c2B34',
    },
};

export class GnosisSafeService {
    private cache = new Cache<string, boolean>();

    public async isAddressGnosisSafe(address: string) {
        const key = `${CACHE_KEY_PREFIX}${address}`;
        const cachedValue = this.cache.get(key);
        if (cachedValue != null) {
            return cachedValue;
        }

        try {
            await Safe.create({
                ethAdapter: await this.getAdapter(),
                safeAddress: getAddress(address),
                contractNetworks,
            });

            this.cache.put(key, true, TIMEOUT);
            return true;
        } catch {
            this.cache.put(key, false, TIMEOUT);
            return false;
        }
    }

    private async getAdapter() {
        const provider = new providers.JsonRpcProvider(networkConfig.rpcUrl);
        const signer = ethers.Wallet.createRandom();

        return new EthersAdapter({
            ethers,
            signer: signer.connect(provider),
        });
    }
}

export const gnosisSafeService = new GnosisSafeService();
