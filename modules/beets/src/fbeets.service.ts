import { Contract } from '@ethersproject/contracts';
import { BigNumber } from 'ethers';
import { oldBnumFromBnum } from '../../util/old-big-number';
import { memCacheGetValue, memCacheSetValue } from '../../util/mem-cache';

const FBEETS_RATIO_CACHE_KEY = 'FBEETS_RATIO';

export class FbeetsService {
    constructor(private readonly fBeetsContract: Contract, private readonly fBeetsPoolContract: Contract) {}

    public async getRatio(): Promise<string> {
        const cached = memCacheGetValue<string>(FBEETS_RATIO_CACHE_KEY);

        if (cached) {
            return cached;
        }

        const totalSupply: BigNumber = await this.fBeetsContract.totalSupply();
        const bptBalance: BigNumber = await this.fBeetsPoolContract.balanceOf(this.fBeetsContract.address);

        const ratio = oldBnumFromBnum(bptBalance).div(oldBnumFromBnum(totalSupply)).toString();

        memCacheSetValue(FBEETS_RATIO_CACHE_KEY, ratio, 60);

        return ratio;
    }
}
