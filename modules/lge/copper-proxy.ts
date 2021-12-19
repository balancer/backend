import { getContractAt } from '../ethers/ethers';
import CopperProxyAbi from './abi/CopperProxy.json';
import { env } from '../../app/env';

const copperProxy = getContractAt(env.COPPER_PROXY_ADDRESS, CopperProxyAbi);

export async function getLbpPoolOwner(poolAddress: string): Promise<string> {
    const poolData = await copperProxy.getPoolData(poolAddress);

    return poolData[0];
}
