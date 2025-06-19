/**
 * Represents data for a token in Aave reserves
 */
export type ReserveToken = {
    symbol: string;
    address: string;
    book?: {
        STATA_TOKEN?: string;
    };
    supplyApr?: number;
};

/**
 * Represents incentive information for a token
 */
export type IncentiveInfo = {
    apr: number;
    rewardToken: {
        symbol: string;
        address: string;
    };
};

/**
 * Represents incentives data for a specific token
 */
export type Incentives = {
    tokenInfo: ReserveToken;
    supplyIncentives: IncentiveInfo[];
};

/**
 * Represents the shape of Aave incentives API response
 */
export type AaveChanResponse = {
    [tokenName: string]: Incentives;
};

/**
 * Interface for Aave incentives client
 */
export interface AaveChanClientInterface {
    /**
     * Fetch incentives for a specific chain
     * @param chainId Chain ID to fetch incentives for
     * @returns Promise with the incentives data
     */
    fetchIncentives(chainId: string): Promise<AaveChanResponse>;

    /**
     * Fetch prime incentives (Lido on Mainnet)
     * Only available on Mainnet (chainId = 1)
     * @returns Promise with the prime incentives data
     */
    fetchPrimeIncentives(): Promise<AaveChanResponse>;
}

/**
 * Implementation of Aave incentives client
 */
export class AaveChanClient implements AaveChanClientInterface {
    private readonly baseUrl = 'https://apps.aavechan.com/api/aave-all-incentives?chainId=';

    constructor(private readonly chainId: string) {}

    /**
     * Fetch incentives for a specific chain
     * @param chainId Chain ID to fetch incentives for
     * @returns Promise with the incentives data
     */
    async fetchIncentives(chainId: string): Promise<AaveChanResponse> {
        try {
            const response = (await fetch(`${this.baseUrl}${chainId}`).then((response) =>
                response.json(),
            )) as AaveChanResponse;
            return response;
        } catch (error) {
            console.error(`Error fetching Aave incentives for chain ${chainId}:`, error);
            return {};
        }
    }

    /**
     * Fetch prime incentives (Lido on Mainnet)
     * Only available on Mainnet (chainId = 1)
     * @returns Promise with the prime incentives data
     */
    async fetchPrimeIncentives(): Promise<AaveChanResponse> {
        if (this.chainId !== `1`) {
            return {};
        }

        try {
            const response = (await fetch(`${this.baseUrl}1&instance=prime`).then((response) =>
                response.json(),
            )) as AaveChanResponse;
            return response;
        } catch (error) {
            console.error('Error fetching Aave prime incentives:', error);
            return {};
        }
    }
}
