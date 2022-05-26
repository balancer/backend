import { FbeetsService } from './src/fbeets.service';
import { getContractAt } from '../util/ethers';
import { networkConfig } from '../config/network-config';
import FreshBeetsAbi from './abi/FreshBeets.json';
import ERC20 from './abi/ERC20.json';

export class BeetsService {
    constructor(private readonly fBeetsService: FbeetsService) {}

    public async getFbeetsRatio(): Promise<string> {
        return this.fBeetsService.getRatio();
    }
}

export const beetsService = new BeetsService(
    new FbeetsService(
        getContractAt(networkConfig.fbeets.address, FreshBeetsAbi),
        getContractAt(networkConfig.fbeets.poolAddress, ERC20),
    ),
);
