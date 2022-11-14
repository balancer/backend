import { FbeetsService } from './lib/fbeets.service';
import { getContractAt } from '../web3/contract';
import { networkConfig } from '../config/network-config';
import FreshBeetsAbi from './abi/FreshBeets.json';
import ERC20 from './abi/ERC20.json';
import { tokenService } from '../token/token.service';

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
        return tokenService.getPriceForToken(tokenPrices, networkConfig.beets.address).toString();
    }
}

export const beetsService = new BeetsService(
    new FbeetsService(
        getContractAt(networkConfig.fbeets?.address ?? '', FreshBeetsAbi),
        getContractAt(networkConfig.fbeets?.poolAddress ?? '', ERC20),
    ),
);
