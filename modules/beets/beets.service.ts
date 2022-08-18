import { FbeetsService } from './lib/fbeets.service';
import { getContractAt } from '../web3/contract';
import { networkConfig } from '../config/network-config';
import FreshBeetsAbi from './abi/FreshBeets.json';
import ERC20 from './abi/ERC20.json';
import { TokenPriceService } from '../token/lib/token-price.service';
import { tokenService } from '../token/token.service';

const beetsFtmAddress = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e';
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
        const beetsPrice = await tokenService.getPriceForToken(tokenPrices, beetsFtmAddress).toString();
        return beetsPrice;
    }
}

export const beetsService = new BeetsService(
    new FbeetsService(
        getContractAt(networkConfig.fbeets.address, FreshBeetsAbi),
        getContractAt(networkConfig.fbeets.poolAddress, ERC20),
    ),
);
