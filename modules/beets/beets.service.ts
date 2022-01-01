import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { cache } from '../cache/cache';
import { env } from '../../app/env';
import { GqlBeetsProtocolData } from '../../schema';
import { getCirculatingSupply } from './beets';

const PROTOCOL_DATA_CACHE_KEY = 'beetsProtocolData';

export class BeetsService {
    constructor() {}

    public async getProtocolData(): Promise<GqlBeetsProtocolData> {
        const protocolData = await cache.getObjectValue<GqlBeetsProtocolData>(PROTOCOL_DATA_CACHE_KEY);

        if (protocolData) {
            return protocolData;
        }

        return this.cacheProtocolData();
    }

    public async cacheProtocolData(): Promise<GqlBeetsProtocolData> {
        const { beetsPrice, marketCap, circulatingSupply } = await this.getBeetsData();
        const { totalLiquidity, totalSwapFee, totalSwapVolume, poolCount } =
            await balancerSubgraphService.getProtocolData({});

        const protocolData = {
            totalLiquidity,
            totalSwapFee,
            totalSwapVolume,
            beetsPrice,
            marketCap,
            circulatingSupply,
            poolCount: `${poolCount}`,
        };

        await cache.putObjectValue(PROTOCOL_DATA_CACHE_KEY, protocolData, 30);

        return protocolData;
    }

    private async getBeetsData(): Promise<{ beetsPrice: string; marketCap: string; circulatingSupply: string }> {
        const { latestPrices } = await balancerSubgraphService.getLatestPrices({
            where: { poolId: env.FBEETS_POOL_ID.toLowerCase(), asset: env.BEETS_ADDRESS.toLowerCase() },
        });
        const beetsPrice = parseFloat(latestPrices[0]?.priceUSD || '0');
        const circulatingSupply = parseFloat(await getCirculatingSupply());

        return {
            beetsPrice: `${beetsPrice}`,
            marketCap: `${beetsPrice * circulatingSupply}`,
            circulatingSupply: `${circulatingSupply}`,
        };
    }
}

export const beetsService = new BeetsService();
