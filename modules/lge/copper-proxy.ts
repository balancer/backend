import CopperProxyAbi from './abi/CopperProxy.json';
import { getContractAt } from '../web3/contract';
import { networkConfig } from '../config/network-config';

const copperProxy = getContractAt(networkConfig.copper.proxyAddress, CopperProxyAbi);

export async function getLbpPoolOwner(poolAddress: string): Promise<string> {
    const poolData = await copperProxy.getPoolData(poolAddress);

    return poolData[0];
}
