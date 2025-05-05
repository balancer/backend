import { YbAprConfig } from '../../../../../network/apr-config-types';
import { AprHandler } from '../types';

interface FluidAPIResponse {
    data: {
        address: string;
        supplyRate: string;
    }[];
}

export class FluidAprHandler implements AprHandler {
    url: string;

    constructor(config: NonNullable<YbAprConfig['fluid']>) {
        this.url = config.url;
    }

    async getAprs() {
        const response = await fetch(this.url).then((res) => res.json() as Promise<FluidAPIResponse>);
        const tokens = response.data.map((token) => [
            token.address.toLowerCase(),
            {
                apr: parseFloat(token.supplyRate) / 10000,
            },
        ]);
        return Object.fromEntries(tokens);
    }
}
