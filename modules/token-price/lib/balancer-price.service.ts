import { balancerService } from '../../balancer-subgraph/balancer.service';
import { OrderDirection, TokenPrice_OrderBy } from '../../balancer-subgraph/generated/balancer-subgraph-types';
import { HistoricalPrices, TokenPrices } from '../token-price-types';
import { balancerTokenMappings } from './balancer-token-mappings';

export class BalancerPriceService {
    public async getTokenPrices(addresses: string[], coingeckoPrices: TokenPrices): Promise<TokenPrices> {
        const balancerTokenPrices: TokenPrices = {};
        const poolIds = addresses.map((address) => balancerTokenMappings.tokenPriceOraclePool[address]);

        const { tokenPrices } = await balancerService.getTokenPrices({
            first: 1000, //TODO: this could stop working at some point
            orderBy: TokenPrice_OrderBy.Timestamp,
            orderDirection: OrderDirection.Desc,
            where: { poolId_in: poolIds },
        });

        for (const address of addresses) {
            const tokenPrice = tokenPrices.find((tokenPrice) => tokenPrice.asset === address);

            if (tokenPrice) {
                balancerTokenPrices[address] = {
                    usd: (coingeckoPrices[tokenPrice.pricingAsset].usd || 0) * parseFloat(tokenPrice.price),
                };
            }
        }

        return balancerTokenPrices;
    }

    public async getTokenHistoricalPrices(address: string): Promise<HistoricalPrices> {
        const poolId = balancerTokenMappings.tokenPriceOraclePool[address];

        const tokenPrices = await balancerService.getTokenPrices({ where: { asset: address, poolId } });
        return {};
    }
}

export const balancerPriceService = new BalancerPriceService();
