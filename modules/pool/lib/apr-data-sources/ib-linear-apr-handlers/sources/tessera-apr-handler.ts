import { Contract } from 'ethers';
import { abi } from './abis/tesseraPool';

import { AprHandler } from '../ib-linear-apr-handlers';
import { networkContext } from '../../../../../network/network-context.service';
import { TesseraAprConfig } from '../../../../../network/apr-config-types';
import * as Sentry from '@sentry/node';

export class TesseraAprHandler implements AprHandler {
    tokens: {
        [tokenName: string]: {
            tesseraPoolAddress: string;
            tokenAddress: string;
            isIbYield?: boolean;
        };
    };
    readonly group = 'TESSERA';

    constructor(aprHandlerConfig: TesseraAprConfig) {
        this.tokens = aprHandlerConfig.tokens;
    }

    async getAprs() {
        let aprEntries = [];
        for (const { tesseraPoolAddress, tokenAddress, isIbYield } of Object.values(this.tokens)) {
            try {
                const contract = new Contract(tesseraPoolAddress, abi, networkContext.provider);
                const poolsUI = await contract.getPoolsUI();

                const pool = poolsUI[0];
                const staked = BigInt(pool.stakedAmount);
                const reward = BigInt(pool.currentTimeRange.rewardsPerHour) * BigInt(24 * 365);
                const apr = Number(reward.toString()) / Number(staked.toString());
                aprEntries.push([tokenAddress, {
                    apr,
                    isIbYield: isIbYield ?? false,
                    group: this.group
                }]);
            } catch (error) {
                console.error('Failed to fetch Tessera Ape Coin APR:', error);
                Sentry.captureException(`Tessera IB APR handler failed: ${error}`);
                aprEntries.push([tokenAddress, { apr: 0, isIbYield: isIbYield ?? false }]);
            }
        }
        return Object.fromEntries(aprEntries);
    }
}
