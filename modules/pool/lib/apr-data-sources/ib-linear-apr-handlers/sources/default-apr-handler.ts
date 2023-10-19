import axios from 'axios';

import { AprHandler } from '../ib-linear-apr-handlers';
import * as Sentry from '@sentry/node';

export class DefaultAprHandler implements AprHandler {
    tokenAddress: string;
    url: string;
    path: string;
    scale: number;
    group?: string;
    isIbYield?: boolean;

    constructor(aprHandlerConfig: {
        sourceUrl: string;
        tokenAddress: string;
        path?: string;
        scale?: number;
        group?: string;
        isIbYield?: boolean;
    }) {
        this.tokenAddress = aprHandlerConfig.tokenAddress;
        this.url = aprHandlerConfig.sourceUrl;
        this.path = aprHandlerConfig.path ?? '';
        this.scale = aprHandlerConfig.scale ?? 100;
        this.group = aprHandlerConfig.group;
        this.isIbYield = aprHandlerConfig.isIbYield;
    }

    async getAprs() {
        try {
            const { data } = await axios.get(this.url, { headers: { 'User-Agent': 'cf' } });
            const value = this.path === '' ? data : this.getValueFromPath(data, this.path);
            const scaledValue = parseFloat(value) / this.scale;

            return {
                [this.tokenAddress]: {
                    apr: scaledValue,
                    isIbYield: this.isIbYield ?? false,
                    group: this.group
                }
            };
        } catch (error) {
            console.error(`Failed to fetch APRs in url ${this.url}:`, error);
            Sentry.captureException(`Failed to fetch default IB APRs in url ${this.url}: ${error}`);
            return {};
        }
    }

    getValueFromPath(obj: any, path: string) {
        if (path === '') {
            return obj;
        }
        const parts = path.split('.');
        let value = obj;
        for (const part of parts) {
            value = value[part];
        }
        return value;
    }
}
