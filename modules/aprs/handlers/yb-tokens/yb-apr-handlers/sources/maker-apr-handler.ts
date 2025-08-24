import { TokenApr, YbAprHandler } from '../../types';
import { abi as makerPotAbi } from './abis/maker-pot';
import cnfg from '../../../../../../config';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const potAddress = '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7';

export const makerAprHandler: YbAprHandler = async ({ sdai }: { sdai: string }) => {
    const aprs: TokenApr[] = [];
    try {
        const client = createPublicClient({
            chain: mainnet,
            transport: http(cnfg.MAINNET.rpcUrl),
        });

        const dsr = await client.readContract({
            abi: makerPotAbi,
            address: potAddress,
            functionName: 'dsr',
        });

        const tokenApr = (Number(dsr) * 10 ** -27 - 1) * 365 * 24 * 60 * 60;

        aprs.push({ address: sdai, apr: tokenApr });
    } catch (error) {
        throw Error(`Maker IB APR hanlder failed: ${(error as Error).message}`);
    }
    return aprs;
};
