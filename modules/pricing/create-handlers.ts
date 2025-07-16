import { Chain } from '@prisma/client';
import { PriceHandler } from './types';
import {
    RektTokensHandler,
    ERC4626PriceHandler,
    AavePriceHandler,
    CoingeckoPriceHandler,
    SwapsPriceHandler,
    BeetsPriceHandler,
} from './handlers';
import { getViemClient } from '../sources/viem-client';
import config from '../../config';

export function createHandlers(chains: Chain[]): PriceHandler[] {
    // Add CoinGecko handler for all chains
    const coingeckoConfig = getCoingeckoConfigForChains(chains);

    const handlers: PriceHandler[] = [
        new RektTokensHandler(),
        new ERC4626PriceHandler(),
        new BeetsPriceHandler(getViemClient),
        new AavePriceHandler(getViemClient),
        new CoingeckoPriceHandler(coingeckoConfig),
        new SwapsPriceHandler(),
    ];

    return handlers;
}

function getCoingeckoConfigForChains(chains: Chain[]) {
    const excludedTokenAddresses: { address: string; chain: Chain }[] = [];

    for (const chain of chains) {
        const chainConfig = Object.values(config).find((c) => c.chain.prismaId === chain);
        if (chainConfig) {
            chainConfig.coingecko.excludedTokenAddresses.forEach((address) =>
                excludedTokenAddresses.push({ address, chain }),
            );
        }
    }

    return { excludedTokenAddresses };
}
