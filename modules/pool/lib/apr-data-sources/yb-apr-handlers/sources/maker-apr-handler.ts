import { AprHandler } from '..';
import { MakerAprConfig } from '../../../../../network/apr-config-types';
import { abi as makerPotAbi } from './abis/maker-pot';
import config from '../../../../../../config';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { Chain } from '@prisma/client';

const client = createPublicClient({
    chain: mainnet,
    transport: http(config.MAINNET.rpcUrl),
});

const potAddress = '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7';
const sdai = {
    [Chain.MAINNET]: '0x83f20f44975d03b1b09e64809b757c47f942beea',
    [Chain.BASE]: '0x99ac4484e8a1dbd6a185380b3a811913ac884d87',
    [Chain.OPTIMISM]: '0x2218a117083f5b482b0bb821d27056ba9c04b1d3',
};

export class MakerAprHandler implements AprHandler {
    group = 'MAKER';
    private sdai: string;

    constructor({ sdai }: MakerAprConfig) {
        this.sdai = sdai;
    }

    async getAprs() {
        const aprs: { [p: string]: { apr: number; isIbYield: boolean; group: string } } = {};
        try {
            const dsr = await client.readContract({
                abi: makerPotAbi,
                address: potAddress,
                functionName: 'dsr',
            });

            const tokenApr = (Number(dsr) * 10 ** -27 - 1) * 365 * 24 * 60 * 60;

            aprs[this.sdai] = {
                apr: tokenApr,
                isIbYield: false,
                group: this.group,
            };
        } catch (error) {
            console.error(`Maker APR Failed for token ${this.sdai}: `, error);
        }
        return aprs;
    }
}
