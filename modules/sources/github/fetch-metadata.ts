type PoolMetadata = {
    name: string;
    vaultVersion: string;
    chainId: number;
    id: string;
    categories: string[];
};

export const fetchMetadata = async (): Promise<PoolMetadata[]> => {
    const response = await fetch('https://github.com/balancer/metadata/raw/main/pools/index.json');
    const metadata = (await response.json()) as PoolMetadata[];

    return metadata;
};
