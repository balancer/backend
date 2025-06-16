import { YbAprConfig } from '../../../../../network/apr-config-types';

const query = `
  {
    osTokens {
      apy
    }
  }
`;

const requestQuery = {
    query,
};

interface Response {
    data: {
        osTokens: {
            apy: string[];
        }[];
    };
}

export class Stakewise {
    constructor(private config: YbAprConfig['stakewise']) {}

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
                osTokens: [{ apy }],
            },
        } = (await response.json()) as Response;

        const apr = Number(apy) / 100;

        return {
            [this.config!.token]: { apr, isIbYield: true },
        };
    }
}
