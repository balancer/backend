export type Price = { usd: number };
export type PriceResponse = { [id: string]: Price };
export type TokenPrices = { [address: string]: Price };

export interface HistoricalPriceResponse {
    market_caps: number[][];
    prices: number[][];
    total_volumes: number[][];
}

export type HistoricalPrices = { [timestamp: string]: number[] };
export type TokenHistoricalPrices = { [address: string]: HistoricalPrices };
