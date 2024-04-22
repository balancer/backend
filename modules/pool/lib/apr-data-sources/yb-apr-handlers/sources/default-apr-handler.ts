import axios from 'axios';
import { AprHandler } from '..';

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
                    group: this.group,
                },
            };
        } catch (error) {
            console.error(`Failed to fetch APRs in url ${this.url}:`, error);
            return {};
        }
    }

    // Get a specific value from a JSON object based on a path
    getValueFromPath = (obj: any, path: string) => {
        const parts = path.split('.');
        let value = obj;
        for (const part of parts) {
            if (part[0] === '{' && part[part.length - 1] === '}') {
                const selector = part.slice(1, -1);
                const variableName = selector.split('==')[0].trim();
                const variableValue = selector.split('==')[1].trim().replace(/"/g, '');
                value = value.find((v: any) => v[variableName] === variableValue);
            } else {
                value = value[part];
            }
        }
        return value;
    };
}
