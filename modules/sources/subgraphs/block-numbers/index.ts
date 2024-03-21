const query = (timestamp: number) => `{
  blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: { timestamp_gt: ${timestamp} }) {
    number
  }
}`;

interface BlockNumberResponse {
    data: {
        blocks: [
            {
                number: string;
            },
        ];
    };
}

export interface BlockNumbersClient {
    fetchBlockByTime: (timestamp: number) => Promise<bigint>;
}

export const getBlockNumbersClient = (url: string): BlockNumbersClient => ({
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
    } = (await response.json()) as BlockNumberResponse;

    return BigInt(blocks[0].number);
};
