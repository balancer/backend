import config from '../../../config';
import { syncLatestFXPrices } from '../../token/latest-fx-price';
import { chainIdToChain } from '../../network/chain-id-to-chain';

export function FXPoolsController() {
    return {
        async syncLatestPrices(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer },
            } = config[chain];

            return syncLatestFXPrices(balancer, chain);
        },
    };
}
