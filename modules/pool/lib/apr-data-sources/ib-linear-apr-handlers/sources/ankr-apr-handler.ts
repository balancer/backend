import axios from 'axios';
import * as Sentry from '@sentry/node';
import { AprHandler } from '../ib-linear-apr-handlers';
import { AnkrAprConfig } from '../../../../../network/apr-config-types';

export class AnkrAprHandler implements AprHandler {
    tokens: {
        [underlyingAssetName: string]: {
            address: string;
            serviceName: string;
            isIbYield?: boolean;
        };
    };
    url: string;
    readonly group = undefined;

    constructor(aprHandlerConfig: AnkrAprConfig) {
        this.tokens = aprHandlerConfig.tokens;
        this.url = aprHandlerConfig.sourceUrl;
    }

    async getAprs(): Promise<{ [tokenAddress: string]: { apr: number; isIbYield: boolean } }> {
        try {
            const { data } = await axios.get(this.url);
            const services = (data as { services: { serviceName: string; apy: string }[] }).services;
            const aprs = Object.fromEntries(
                Object.values(this.tokens).map(({ address, serviceName, isIbYield }) => {
                    const service = services.find((service) => service.serviceName === serviceName);
                    if (!service) {
                        return [address, 0];
                    }
                    return [address, { apr: parseFloat(service.apy) / 1e2, isIbYield: isIbYield ?? false }];
                }),
            );
            return aprs;
        } catch (error) {
            console.error('Failed to fetch Ankr APR:', error);
            Sentry.captureException(`Ankr IB APR handler failed: ${error}`);
            return {};
        }
    }
}
