import { YbAprConfig } from '../../../../../network/apr-config-types';

const query = `{
  syrupGlobals {
    apy
  }
}`;

const requestQuery = {
    query,
};

interface Response {
    data: {
        syrupGlobals: {
            apy: string;
        };
    };
}

export class Maple {
    constructor(private config: YbAprConfig['maple']) {}

    async getAprs() {
        const response = await fetch(this.config!.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestQuery),
        });

        const {
            data: {
                syrupGlobals: { apy },
            },
        } = (await response.json()) as Response;

        const apr = parseFloat(apy) / 1e30;

        return {
            [this.config!.token]: { apr, isIbYield: true },
        };
    }
}
