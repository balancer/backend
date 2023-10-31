import { AprHandler } from '../ib-linear-apr-handlers';
import { MakerAprConfig } from '../../../../../network/apr-config-types';
import { getContractAt } from '../../../../../web3/contract';
import { abi as makerPotAbi } from './abis/maker-pot';
import * as Sentry from '@sentry/node';

export class MakerAprHandler implements AprHandler {
    group = 'MAKER';
    tokens: {
        [tokenName: string]: {
            address: string;
            potAddress: string;
            isIbYield?: boolean;
        };
    };

    constructor(aprConfig: MakerAprConfig) {
        this.tokens = aprConfig.tokens;
    }

    async getAprs() {
        const aprs: { [p: string]: { apr: number; isIbYield: boolean, group: string } } = {};
        for (const { address, potAddress, isIbYield } of Object.values(this.tokens)) {
            try {
                const potContract = getContractAt(potAddress, makerPotAbi);
                const dsr = await potContract.dsr();
                if (!dsr) {
                    continue;
                }
                const tokenApr = (Number(dsr) * 10 ** -27 - 1) * 365 * 24 * 60 * 60;
                aprs[address] = {
                    apr: tokenApr,
                    isIbYield: isIbYield ?? false,
                    group: this.group
                };
            } catch (error) {
                console.error(`Maker APR Failed for token ${address}: `, error);
                Sentry.captureException(`Maker APR Failed for token ${address}: ${error}`);
            }
        }
        return aprs;
    }
}
