import axios from 'axios';

import { AprHandler } from '..';
import { TranchessAprConfig } from '../../../../../network/apr-config-types';
import * as Sentry from '@sentry/node';

export class TranchessAprHandler implements AprHandler {
    url: string;
    tokens: {
        [tokenName: string]: {
            address: string;
            underlyingAssetName: string;
            isIbYield?: boolean;
        };
    };
    readonly group = 'TRANCHESS';

    constructor(aprHandlerConfig: TranchessAprConfig) {
        this.tokens = aprHandlerConfig.tokens;
        this.url = aprHandlerConfig.sourceUrl;
    }

    async getAprs() {
        try {
            const { data } = await axios.get('https://tranchess.com/eth/api/v3/funds');
            // const [{ weeklyAveragePnlPercentage }] = data as { weeklyAveragePnlPercentage: string }[];
            const aprEntries = Object.values(this.tokens).map(({ address, underlyingAssetName, isIbYield }) => {
                const weeklyAveragePnlPercentage = (
                    data as { weeklyAveragePnlPercentage: string; name: string }[]
                ).filter(({ name }) => name === underlyingAssetName)[0].weeklyAveragePnlPercentage;
                return [
                    address,
                    {
                        apr: (365 * Number(weeklyAveragePnlPercentage)) / 1e18,
                        isIbYield: isIbYield ?? false,
                        group: this.group,
                    },
                ];
            });
            // The key weeklyAveragePnlPercentage is the daily yield of qETH in 18 decimals, timing 365 should give you the APR.
            return Object.fromEntries(aprEntries);
        } catch (error) {
            console.error('Failed to fetch Tranchess APR:', error);
            Sentry.captureException(`Tranchess IB APR handler failed: ${error}`);
            return {};
        }
    }
}
