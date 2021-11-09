import { Contract, utils } from 'ethers';
import { ethersService } from '../ethers/ethers.service';
import { fp } from '../util/numbers';

const INITIAL_MINT = fp(50_000_000);

class BeetsService {
    private readonly beetsContract: Contract;
    constructor() {
        this.beetsContract = ethersService.getContractAt(process.env.BEETS_ADDRESS!, 'BeethovenxToken');
    }

    async getCirculatingSupply() {
        const totalSupply = await this.beetsContract.totalSupply();
        return utils.formatUnits(totalSupply.sub(INITIAL_MINT));
    }
}

export const beetsService = new BeetsService();
