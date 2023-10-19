import { AprHandler } from '../ib-linear-apr-handlers';
import { BloomAprConfig } from '../../../../../network/apr-config-types';
import { getContractAt } from '../../../../../web3/contract';
import { abi as bloomBpsFeed } from './abis/bloom-bps-feed';
import * as Sentry from '@sentry/node';

export class BloomAprHandler implements AprHandler {
    group = "BLOOM";

    tokens: BloomAprConfig['tokens'];

    constructor(config: BloomAprConfig) {
        this.tokens = config.tokens;
    }

    async getAprs() {
        const aprs: { [p: string]: { apr: number; isIbYield: boolean, group?: string } } = {};
        for (const { address, feedAddress, isIbYield } of Object.values(this.tokens)) {
            try {
                const feedContract = getContractAt(feedAddress, bloomBpsFeed);
                const currentRate = await feedContract.currentRate();
                if (!currentRate) {
                    continue;
                }
                const tokenApr = (Number(currentRate) - 10000) / 10000;
                aprs[address] = {
                    apr: tokenApr,
                    isIbYield: isIbYield ?? false,
                    group: this.group
                };
            } catch (error) {
                console.error(`Bloom APR Failed for token ${address}: `, error);
                Sentry.captureException(`Bloom APR Failed for token ${address}: ${error}`);
            }
        }
        return aprs;
    }
}
