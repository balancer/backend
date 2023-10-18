import { AprHandler } from '../ib-linear-apr-handlers';
import axios from 'axios';
import { YearnAprConfig } from '../../../../../network/apr-config-types';
import * as Sentry from '@sentry/node';

export class YearnAprHandler implements AprHandler {
    sourceUrl: string;
    isIbYield?: boolean;
    group: string = 'YEARN';

    constructor(aprHandlerConfig: YearnAprConfig) {
        this.sourceUrl = aprHandlerConfig.sourceUrl;
        this.isIbYield = aprHandlerConfig.isIbYield;
    }
    async getAprs() {
        try {
            const { data } = await axios.get<YearnVault[]>(this.sourceUrl);
            const aprs = Object.fromEntries(
                data.map(({ address, apy: { net_apy } }) => {
                    return [address.toLowerCase(), {
                        apr: net_apy,
                        isIbYield: this.isIbYield ?? false,
                        group: this.group
                    }];
                }),
            );
            return aprs;
        } catch (error) {
            console.error(`Yearn IB APR handler failed: `, error);
            Sentry.captureException(`Yearn IB APR handler failed: ${error}`);
            return {};
        }
    }
}

import { Dictionary } from 'lodash';

interface YearnVault {
    address: string;
    apy: YearnVaultApy;
}

interface YearnVaultApy {
    net_apy: number;
}
