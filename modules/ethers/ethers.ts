import { Contract, ethers } from 'ethers';
import { env } from '../../app/env';

const jsonRpcProvider = new ethers.providers.JsonRpcProvider(env.RPC_URL);

export function getContractAt<T extends Contract = Contract>(address: string, abi: any): T {
    return new Contract(address, abi, jsonRpcProvider) as T;
}
