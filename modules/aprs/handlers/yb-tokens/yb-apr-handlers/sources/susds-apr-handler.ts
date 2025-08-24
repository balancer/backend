import { YbAprHandler } from '../../types';
import config from '../../../../../../config';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const ssrOracle = '0x65d946e533748a998b1f0e430803e39a6388f7a1';

export const sUSDSAprHandler: YbAprHandler = async ({ oracle, token }: { oracle: string; token: string }) => {
    try {
        const client = createPublicClient({
            chain: base,
            transport: http(config.BASE.rpcUrl),
        });

        const getAPR = await client.readContract({
            abi: [parseAbiItem('function getAPR() view returns (uint256)')],
            address: oracle as `0x${string}`,
            functionName: 'getAPR',
        });

        const apr = Number(getAPR) * 10 ** -27;

        return [{ address: token, apr }];
    } catch (error) {
        throw Error(`SUSDS IB APR hanlder failed: ${(error as Error).message}`);
    }
};
