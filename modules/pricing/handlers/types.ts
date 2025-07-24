import { Chain } from '@prisma/client';

export interface HandlerConfiguration {
    chain: Chain;
    excludedTokenAddresses: string[];
}

export interface CoingeckoHandlerConfig {
    excludedTokenAddresses: string[];
}