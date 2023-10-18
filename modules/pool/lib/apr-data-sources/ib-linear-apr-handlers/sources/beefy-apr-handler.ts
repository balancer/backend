import { BeefyAprConfig } from '../../../../../network/apr-config-types';
import { AprHandler } from '../ib-linear-apr-handlers';
import axios from 'axios';
import * as Sentry from '@sentry/node';

export class BeefyAprHandler implements AprHandler {
    tokens: {
        [tokenName: string]: {
            address: string;
            vaultId: string;
            isIbYield?: boolean;
        };
    };
    sourceUrl: string;
    group: string | undefined = 'BEEFY';

    constructor(aprConfig: BeefyAprConfig) {
        this.tokens = aprConfig.tokens;
        this.sourceUrl = aprConfig.sourceUrl;
    }

    async getAprs(): Promise<{ [p: string]: { apr: number; isIbYield: boolean } }> {
        try {
            const { data: aprData } = await axios.get<VaultApr>(this.sourceUrl);
            const aprs: { [tokenAddress: string]: { apr: number; isIbYield: boolean } } = {};
            for (const { address, vaultId, isIbYield } of Object.values(this.tokens)) {
                aprs[address] = { apr: aprData[vaultId].vaultApr, isIbYield: isIbYield ?? false };
            }
            return aprs;
        } catch (error) {
            console.error(`Beefy IB APR hanlder failed: `, error);
            Sentry.captureException(`Beefy IB APR handler failed: ${error}`);
            return {};
        }
    }
}

type VaultApr = Record<
    string,
    {
        vaultApr: number;
        compoundingsPerYear: number;
        beefyPerformanceFee: number;
        vaultApy: number;
        lpFee: number;
        tradingApr: number;
        totalApy: number;
    }
>;
