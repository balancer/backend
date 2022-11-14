import { getAddress } from 'ethers/lib/utils';
import { Contract, ethers } from 'ethers';
import { networkConfig } from '../config/network-config';

export function returnChecksum() {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            const result = originalMethod.apply(this, args);
            return getAddress(result);
        };
        return descriptor;
    };
}

export const jsonRpcProvider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);

export function getContractAt<T extends Contract>(address: string, abi: any): T {
    return new Contract(address, abi, jsonRpcProvider) as T;
}
