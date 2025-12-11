import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import abi from './abi/balancerTokenAdmin.json';
import { Chain } from '@prisma/client';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

export async function getInflationRate(chain: Chain): Promise<BigNumber> {
    if (chain === 'MAINNET') {
        const tokenAdmin = new Contract(
            AllNetworkConfigsKeyedOnChain[chain].data.balancer.v2.tokenAdmin!,
            abi,
            AllNetworkConfigsKeyedOnChain[chain].provider,
        );
        const inflationRate = await tokenAdmin.getInflationRate();
        return inflationRate;
    } else {
        return BigNumber.from(0);
    }
}
