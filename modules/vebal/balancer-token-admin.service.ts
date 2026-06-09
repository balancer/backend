import abi from './abi/balancerTokenAdmin';
import { Chain } from '@prisma/client';
import config from '../../config';
import { getViemClient } from '../sources/viem-client';

export async function getInflationRate(chain: Chain): Promise<bigint> {
    if (chain === 'MAINNET') {
        const viemClient = getViemClient(chain);
        const inflationRate = await viemClient.readContract({
            address: config[chain].balancer.v2.tokenAdmin! as `0x${string}`,
            abi: abi,
            functionName: 'getInflationRate',
        });

        return inflationRate;
    } else {
        return 0n;
    }
}
