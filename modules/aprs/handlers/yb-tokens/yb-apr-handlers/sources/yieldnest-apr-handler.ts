import { YbAprConfig } from '../../../../../network/apr-config-types';

const query = `{
    getApr {
      apr7d
    }
  }
  `;

const requestQuery = {
    query,
};

interface Response {
    data: {
        getApr: {
            apr7d: number;
        };
    };
}

export class Yieldnest {
    constructor(private config: YbAprConfig['yieldnest']) {}

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
                getApr: { apr7d },
            },
        } = (await response.json()) as Response;

        const apr = apr7d / 100;

        return {
            [this.config!.token]: { apr, isIbYield: true },
        };
    }
}
