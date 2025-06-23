import { YbAprConfig } from '../../../../../network/apr-config-types';
import { YbAprHandler } from '../types';

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

const wrappers = {
    '0x589a7339c6d0c8777e7429f57f2f95c069c37288': 'USDC',
    '0x98efe85735f253a0ed0be8e2915ff39f9e4aff0f': 'USR',
};

export class ExtraHandler implements YbAprHandler {
    url: string;

    constructor(config: NonNullable<YbAprConfig['extra']>) {
        this.url = config.url;
    }

    async getAprs() {
        const response = await fetch(this.url).then((res) => res.json() as Promise<ExtraAPIResponse>);
        const tokens = response.base
            .filter((token) => ['USR', 'USDC'].includes(token.symbol))
            .map((token) => [
                token.symbol.toUpperCase(),
                {
                    apr: parseFloat(token.totalAPY),
                },
            ]);
        const aprMap = Object.fromEntries(tokens);
        const aprs = Object.keys(wrappers).map((wrapper) => [
            wrapper,
            aprMap[wrappers[wrapper as keyof typeof wrappers]],
        ]);
        return Object.fromEntries(aprs);
    }
}
