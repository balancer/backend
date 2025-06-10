import { YbAprConfig } from '../../../../../network/apr-config-types';
import { AprHandler } from '../types';

interface ExtraAPIResponse {
    op: {
        address: string;
        symbol: string;
        totalAPY: string;
    }[];
    base: {
        address: string;
        symbol: string;
        totalAPY: string;
    }[];
}

export class ExtraHandler implements AprHandler {
    url: string;

    constructor(config: NonNullable<YbAprConfig['extra']>) {
        this.url = config.url;
    }

    async getAprs() {
        const response = await fetch(this.url).then((res) => res.json() as Promise<ExtraAPIResponse>);
        const tokens = response.base
            .filter((token) => ['USR', 'USDC'].includes(token.symbol))
            .map((token) => [
                token.address.toLowerCase(),
                {
                    apr: parseFloat(token.totalAPY),
                },
            ]);
        console.log(tokens);
        return Object.fromEntries(tokens);
    }
}
