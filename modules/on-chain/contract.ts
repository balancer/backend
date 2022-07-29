import { getAddress } from 'ethers/lib/utils';
import { Contract, ethers } from 'ethers';
import { env } from '../../app/env';

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

export const jsonRpcProvider = new ethers.providers.JsonRpcProvider(env.RPC_URL);

export function getContractAt(address: string, abi: any): Contract {
    return new Contract(address, abi, jsonRpcProvider);
}
