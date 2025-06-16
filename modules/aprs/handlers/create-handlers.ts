import { Chain } from '@prisma/client';
import { AprHandler } from '../types';
import * as handlers from '.';
import config from '../../../config';
import { AaveRewardsAprConfig } from './types';

/**
 * Creates handler instances for a specific chain
 */
export function createHandlers(chain: Chain): AprHandler[] {
    const handlerList: AprHandler[] = [];

    // Default handlers for all of the chains
    handlerList.push(new handlers.SwapFeeAprHandler());
    handlerList.push(new handlers.DynamicSwapFeeAprHandler());

    if (config[chain].aprHandlers.ybAprHandler) {
        handlerList.push(new handlers.YbTokensAprHandler(config[chain].aprHandlers.ybAprHandler, chain));
    }

    if (config[chain].aprHandlers.maBeetsAprHandler) {
        handlerList.push(new handlers.MaBeetsAprHandler(config[chain].aprHandlers.maBeetsAprHandler.beetsAddress));
        handlerList.push(new handlers.BeetswarsGaugeVotingAprHandler());
    }

    // Add Aave API handler if configured for this chain
    if (config[chain].aprHandlers.aaveRewardsAprHandler) {
        handlerList.push(
            new handlers.AaveApiAprHandler(config[chain].aprHandlers.aaveRewardsAprHandler as AaveRewardsAprConfig),
        );
    }

    return handlerList;
}
