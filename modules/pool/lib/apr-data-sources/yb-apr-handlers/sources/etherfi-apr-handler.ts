const url =
    'https://ded76165a2fb6f7887260a3a0f626de7.thegraph.chainnodes.org/subgraphs/name/etherfi/etherfi-subgraph-v0-8-2';

const query = `
  {
    rebaseEventLinkedLists {
      latest_aprs
    }
  }
`;

const requestQuery = {
    query,
};

interface Response {
    data: {
        rebaseEventLinkedLists: {
            latest_aprs: string[];
        }[];
    };
}

export class Etherfi {
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
                rebaseEventLinkedLists: [{ latest_aprs }],
            },
        } = (await response.json()) as Response;

        const avgApr = latest_aprs.map((apr) => Number(apr)).reduce((acc, apr) => acc + apr, 0) / latest_aprs.length;

        return {
            [this.tokenAddress]: {
                apr: avgApr / 10000,
                isIbYield: true,
            },
        };
    }
}
