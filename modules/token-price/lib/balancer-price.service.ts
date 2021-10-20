import { balancerService } from '../../balancer-subgraph/balancer.service';
import { OrderDirection, TokenPrice_OrderBy } from '../../balancer-subgraph/generated/balancer-subgraph-types';
import { HistoricalPrice, TokenHistoricalPrices, TokenPrices } from '../token-price-types';
import { fiveMinutesInSeconds, getDailyTimestampRanges, getHourlyTimestamps } from '../../util/time';
import _ from 'lodash';

export class BalancerPriceService {
    public async getTokenPrices(addresses: string[], coingeckoPrices: TokenPrices): Promise<TokenPrices> {
        const balancerTokenPrices: TokenPrices = {};

        const { tokenPrices } = await balancerService.getTokenPrices({
            first: 1000, //TODO: this could stop working at some point
            orderBy: TokenPrice_OrderBy.Timestamp,
            orderDirection: OrderDirection.Desc,
            where: { asset_in: addresses },
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

    public async getHistoricalTokenPrices({
        address,
        days,
        coingeckoHistoricalPrices,
    }: {
        address: string;
        days: number;
        coingeckoHistoricalPrices: TokenHistoricalPrices;
    }): Promise<HistoricalPrice[]> {
        const ranges = getDailyTimestampRanges(days);
        const historicalTokenPrices: HistoricalPrice[] = [];
        const minTimestamp = _.min(_.flatten(ranges));
        const maxTimestamp = _.max(_.flatten(ranges));

        const allTokenPrices = await balancerService.getAllTokenPrices({
            where: { asset: address, timestamp_gte: `${minTimestamp}`, timestamp_lte: `${maxTimestamp}` },
            orderBy: TokenPrice_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        for (const range of ranges) {
            const tokenPrices = allTokenPrices.filter(
                (item) => parseInt(item.timestamp) >= range[0] && parseInt(item.timestamp) < range[1],
            );

            if (tokenPrices.length === 0) {
                continue;
            }

            const hourlyTimestamps = getHourlyTimestamps(range[0], range[1]);

            for (const timestamp of hourlyTimestamps) {
                //find the price with the closest timestamp
                const closest = tokenPrices.reduce((a, b) => {
                    return Math.abs(parseInt(b.timestamp) - timestamp) < Math.abs(parseInt(a.timestamp) - timestamp)
                        ? b
                        : a;
                });

                //filter out any matches that are further than 5 minutes away.
                //This can happen for periods before the token was listed or times in the future
                if (Math.abs(timestamp - parseInt(closest.timestamp)) < fiveMinutesInSeconds) {
                    const pricingAsset = coingeckoHistoricalPrices[closest.pricingAsset]?.find(
                        (price) => price.timestamp === timestamp * 1000,
                    );

                    if (pricingAsset) {
                        historicalTokenPrices.push({
                            timestamp: timestamp * 1000,
                            price: parseFloat(closest.price) * pricingAsset.price,
                        });
                    }
                }
            }
        }

        return historicalTokenPrices;
    }
}

export const balancerPriceService = new BalancerPriceService();
