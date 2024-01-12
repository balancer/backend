const url = 'https://mainnet-graph.stakewise.io/subgraphs/name/stakewise/stakewise';

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
    constructor(private tokenAddress: string) {}

    async getAprs() {
        const response = await fetch(url, {
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

        return {
            [this.tokenAddress]: {
                apr: Number(apy) / 100,
                isIbYield: true,
            },
        };
    }
}
