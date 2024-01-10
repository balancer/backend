import axios from 'axios';
import * as Sentry from '@sentry/node';
import { AprHandler } from '..';
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

    constructor(config: AnkrAprConfig) {
        this.tokens = config.tokens;
        this.url = config.sourceUrl;
    }

    async getAprs() {
        try {
            const { data } = await axios.get(this.url);
            const services = (data as { services: { serviceName: string; apy: string }[] }).services;
            const aprs = Object.fromEntries(
                Object.values(this.tokens).map(({ address, serviceName, isIbYield }) => {
                    const service = services.find((service) => service.serviceName === serviceName);
                    if (!service) {
                        return [address, 0];
                    }
                    return [
                        address,
                        {
                            apr: parseFloat(service.apy) / 1e2,
                            isIbYield: isIbYield ?? false,
                        },
                    ];
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
