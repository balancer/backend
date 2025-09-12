import { Chain } from '@prisma/client';
import { AprHandler } from '../types';
import * as handlers from '.';
import config from '../../../config';
import { chainToChainId } from '../../network/chain-id-to-chain';
import { tokenService } from '../../token/token.service';

/**
 * Creates handler instances for a specific chain
 */
export function createHandlers(chain: Chain): AprHandler[] {
    const handlerList: AprHandler[] = [];

    // Default handlers for all of the chains
    handlerList.push(new handlers.SwapFeeAprHandler());
    handlerList.push(new handlers.NestedPoolAprHandler());
    // handlerList.push(new handlers.QuantAmmAprHandler());
    handlerList.push(new handlers.LiquidityGaugeAprHandler(tokenService));
    handlerList.push(new handlers.MerklAprHandler());

    // Mainnet specific handlers
    if (chain === Chain.MAINNET) {
        handlerList.push(new handlers.VeBalProtocolAprHandler());
        handlerList.push(new handlers.VeBalVotingAprHandler());
    }

    if (config[chain].aprHandlers.maBeetsAprHandler) {
        handlerList.push(
            new handlers.MaBeetsAprHandler(config[chain].aprHandlers.maBeetsAprHandler.beetsAddress, tokenService),
        );
        handlerList.push(new handlers.BeetswarsGaugeVotingAprHandler());
    }

    if (config[chain].aprHandlers.ybAprHandler) {
        handlerList.push(new handlers.YbTokensAprHandler());
    }

    if (config[chain].aprHandlers.morphoRewardsAprHandler) {
        handlerList.push(new handlers.MorphoRewardsAprHandler());
    }

    // Add Aave API handler if configured for this chain
    if (config[chain].aprHandlers.aaveRewardsAprHandler) {
        handlerList.push(new handlers.AaveApiAprHandler(chainToChainId[chain]));
    }

    return handlerList;
}
