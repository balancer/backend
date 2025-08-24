import { AprHandler } from '..';
import { abi as SiloLensAbi } from './abis/silo-lens';
import { YbAprConfig, TokenApr } from '../../types';
import { formatEther } from 'viem';
import { getViemClient } from '../../../../../sources/viem-client';

const SILO_LENS_ADDR = '0xb6adbb29f2d8ae731c7c72036a7fd5a7e970b198';

export const siloAprHandler: AprHandler = async (config: YbAprConfig['silo']) => {
    const aprs: TokenApr[] = [];
    const client = getViemClient('SONIC');
    for (const marketAddress of config!.markets) {
        try {
            const result = await client.readContract({
                address: SILO_LENS_ADDR as `0x${string}`,
                abi: SiloLensAbi,
                functionName: 'getDepositAPR',
                args: [marketAddress as `0x${string}`],
            });

            aprs.push({ address: marketAddress, apr: parseFloat(formatEther(result)) });
        } catch (error) {
            throw Error(`Silo IB APR hanlder failed: ${(error as Error).message}`);
        }
    }

    return aprs;
};
