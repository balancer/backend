const query = (timestamp: number) => `{
  blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: { timestamp_gt: ${timestamp} }) {
    number
  }
}`;

interface BlockNumberSubgraphResponse {
    data: {
        blocks: [
            {
                number: string;
            },
        ];
    };
}

export interface BlockNumbersSubgraphClient {
    fetchBlockByTime: (timestamp: number) => Promise<bigint>;
}

export const getBlockNumbersSubgraphClient = (url: string): BlockNumbersSubgraphClient => ({
    fetchBlockByTime: (timestamp: number) => fetchBlockByTime(url, timestamp),
});

const fetchBlockByTime = async (endpoint: string, timestamp: number): Promise<bigint> => {
    const payload = {
        query: query(timestamp),
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    });

    const {
        data: { blocks },
    } = (await response.json()) as BlockNumberSubgraphResponse;

    return BigInt(blocks[0].number);
};
