import config from '../../../config';
import { syncLatestFXPrices } from '../../token/latest-fx-price';
import { Chain } from '@prisma/client';

export function FXPoolsController() {
    return {
        async syncLatestPrices(chain: Chain) {
            const {
                subgraphs: { balancer },
            } = config[chain];

            return syncLatestFXPrices(balancer, chain);
        },
    };
}
