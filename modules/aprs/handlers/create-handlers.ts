import { Chain } from '@prisma/client';
import { AprHandler } from '../types';
import * as handlers from '.';
import { AaveRewardsAprConfig } from './types';
import config from '../../../config';

/**
 * Creates handler instances for a specific chain
 */
export function createHandlers(chain: Chain): AprHandler[] {
    const handlerList: AprHandler[] = [];

    // Default handlers for all of the chains
    handlerList.push(new handlers.SwapFeeAprHandler());

    if (config[chain].aprHandlers.ybAprHandler) {
        handlerList.push(new handlers.YbTokensAprHandler(config[chain].aprHandlers.ybAprHandler, chain));
    }

    // Add Aave API handler if configured for this chain
    if (config[chain].aprHandlers.aaveRewardsAprHandler) {
        handlerList.push(
            new handlers.AaveApiAprHandler(config[chain].aprHandlers.aaveRewardsAprHandler as AaveRewardsAprConfig),
        );
    }

    return handlerList;
}
