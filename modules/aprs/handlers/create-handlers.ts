import { Chain } from '@prisma/client';
import { AprHandler } from '../types';
import * as handlers from '.';
import chainConfigs from '../config';
import { AaveApiConfig } from './types';

/**
 * Creates handler instances for a specific chain
 */
export function createHandlers(chain: Chain): AprHandler[] {
    const handlerList: AprHandler[] = [];

    // Default handlers for all of the chains
    handlerList.push(new handlers.SwapFeeAprHandler());

    if (chainConfigs[chain].ybAprConfig) {
        handlerList.push(new handlers.YbTokensAprHandler(chainConfigs[chain].ybAprConfig, chain));
    }

    // Add Aave API handler if configured for this chain
    if (chainConfigs[chain].aaveApiConfig) {
        handlerList.push(new handlers.AaveApiAprHandler(chainConfigs[chain].aaveApiConfig as AaveApiConfig));
    }

    return handlerList;
}
