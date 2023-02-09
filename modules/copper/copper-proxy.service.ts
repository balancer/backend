import CopperProxyAbi from '../lge/abi/CopperProxy.json';
import { getContractAt } from '../web3/contract';
import { AddressZero } from '@ethersproject/constants';
import { networkContext } from '../network/network-context.service';

export class CopperProxyService {
    async getLbpPoolOwner(poolAddress: string): Promise<string> {
        const copperProxyContract = getContractAt(
            networkContext.data.copper?.proxyAddress ?? AddressZero,
            CopperProxyAbi,
        );

        const poolData = await copperProxyContract.getPoolData(poolAddress);

        return poolData[0];
    }
}

export const copperProxyService = new CopperProxyService();
