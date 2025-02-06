import { AprHandler } from '../types';
import config from '../../../../../../config';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
    chain: base,
    transport: http(config.BASE.rpcUrl),
});

const ssrOracle = '0x65d946e533748a998b1f0e430803e39a6388f7a1';

export class SUSDSAprHandler implements AprHandler {
    group = 'MAKER';
    private oracle: string;
    private token: string;

    constructor({ oracle, token }: { oracle: string; token: string }) {
        this.oracle = oracle;
        this.token = token;
    }

    async getAprs() {
        const aprs: { [p: string]: { apr: number; isIbYield: boolean; group: string } } = {};
        try {
            const apr = await client.readContract({
                abi: [parseAbiItem('function getAPR() view returns (uint256)')],
                address: this.oracle as `0x${string}`,
                functionName: 'getAPR',
            });

            const tokenApr = Number(apr) * 10 ** -27;

            aprs[this.token] = {
                apr: tokenApr,
                isIbYield: false,
                group: this.group,
            };
        } catch (error) {
            console.error(`sUSDS APR Failed for token ${this.token}: `, error);
        }
        return aprs;
    }
}
