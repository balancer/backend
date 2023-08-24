import { FbeetsService } from './lib/fbeets.service';
import { tokenService } from '../token/token.service';
import { networkContext } from '../network/network-context.service';

export class BeetsService {
    constructor(private readonly fBeetsService: FbeetsService) {}

    public async getFbeetsRatio(): Promise<string> {
        return this.fBeetsService.getRatio();
    }

    public async syncFbeetsRatio(): Promise<void> {
        return this.fBeetsService.syncRatio();
    }

    public async getBeetsPrice(): Promise<string> {
        const tokenPrices = await tokenService.getTokenPrices();
        return tokenService.getPriceForToken(tokenPrices, networkContext.data.beets!.address).toString();
    }
}

export const beetsService = new BeetsService(new FbeetsService());
