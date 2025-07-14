const url = 'https://api.goldsky.com/api/public/project_cmcccb4vz1nhh01x888di8lgk/subgraphs/mainstreet/0.0.1/gn';

const query = `
  {
  smsUsdStats(id: "statsSmsUsd") {
    apy
  }
  }
`;

const requestQuery = {
    query,
};

interface Response {
    data: {
        smsUsdStats: {
            apy: string;
        };
    };
}

export class Mainstreet {
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
                smsUsdStats: { apy },
            },
        } = (await response.json()) as Response;

        const apr = Number(apy);

        return {
            [this.tokenAddress]: {
                apr: apr / 100,
                isIbYield: true,
            },
        };
    }
}
