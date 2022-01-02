export interface TokenDefinition {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    chainId: number;
    coingeckoPlatformId?: string;
    coingeckoContractAddress?: string;
}
