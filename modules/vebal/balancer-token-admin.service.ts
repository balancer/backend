import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import abi from './abi/balancerTokenAdmin.json';
import { networkContext } from '../network/network-context.service';

export async function getInflationRate(): Promise<BigNumber> {
    if (networkContext.isMainnet) {
        const tokenAdmin = new Contract(networkContext.data.balancer.v2.tokenAdmin!, abi, networkContext.provider);
        const inflationRate = await tokenAdmin.getInflationRate();
        return inflationRate;
    } else {
        return BigNumber.from(0);
    }
}
