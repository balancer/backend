import CopperProxyAbi from '../lge/abi/CopperProxy.json';
import { getContractAt } from '../web3/contract';
import { networkConfig } from '../config/network-config';
import { AddressZero } from '@ethersproject/constants';

const copperProxyContract = getContractAt(networkConfig.copper?.proxyAddress ?? AddressZero, CopperProxyAbi);

export async function getLbpPoolOwner(poolAddress: string): Promise<string> {
    const poolData = await copperProxyContract.getPoolData(poolAddress);

    return poolData[0];
}

export class CopperProxyService {
    async getLbpPoolOwner(poolAddress: string): Promise<string> {
        const poolData = await copperProxyContract.getPoolData(poolAddress);

        return poolData[0];
    }
}

export const copperProxyService = new CopperProxyService();
