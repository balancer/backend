import type { AprHandler } from '../types';

export class DefaultAprHandler implements AprHandler {
    tokenAddress: string;
    url: string;
    path: string;
    scale: number;
    group?: string;
    isIbYield?: boolean;
    headers?: any;
    body?: any;

    constructor(aprHandlerConfig: {
        sourceUrl: string;
        tokenAddress: string;
        path?: string;
        scale?: number;
        group?: string;
        isIbYield?: boolean;
        headers?: any;
        body?: any;
    }) {
        this.tokenAddress = aprHandlerConfig.tokenAddress;
        this.url = aprHandlerConfig.sourceUrl;
        this.path = aprHandlerConfig.path ?? '';
        this.scale = aprHandlerConfig.scale ?? 100;
        this.group = aprHandlerConfig.group;
        this.isIbYield = aprHandlerConfig.isIbYield;
        this.headers = aprHandlerConfig.headers ?? { 'User-Agent': 'cf' };
        this.body = aprHandlerConfig.body;
    }

    async getAprs() {
        try {
            let data = {};
            if (this.body) {
                data = await fetch(this.url, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(this.body),
                }).then((res) => res.json() as any);
            } else {
                data = await fetch(this.url, {
                    headers: this.headers,
                }).then((res) => res.json() as any);
            }
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
        const parts = path.split(/(?<!")\.(?!\w*")/);
        let value = obj;
        for (const part of parts) {
            if (part[0] === '{' && part[part.length - 1] === '}') {
                const selector = part.slice(1, -1);
                const variableName = selector.split('==')[0].trim();
                const variableValue = selector.split('==')[1].trim().replace(/"/g, '');
                value = value.find((v: any) => v[variableName] === variableValue);
            } else if (part.includes('[')) {
                const indexStart = part.indexOf('[');
                const indexEnd = part.indexOf(']');
                const arrayName = part.slice(0, indexStart);
                const index = parseInt(part.slice(indexStart + 1, indexEnd), 10);
                value = value[arrayName][index];
            } else {
                value = value[part];
            }
        }
        return value;
    };
}
