import axios from "axios";

const POOLS_METADATA_URL = "https://raw.githubusercontent.com/balancer/metadata/main/pools/featured.json";

interface PoolMetadata {
    id: string;
    imageUrl: string;
    primary: boolean;
}

export class PoolMetadataService {
    async getPoolsMetadata(): Promise<PoolMetadata[]> {
        const { data } = await axios.get<PoolMetadata[]>(POOLS_METADATA_URL);
        return data;
    }
}

export const poolMetadataService = new PoolMetadataService();
