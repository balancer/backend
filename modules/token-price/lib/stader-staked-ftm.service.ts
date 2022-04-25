import { Price } from '../token-price-types';
import { getContractAt } from '../../ethers/ethers';
import { formatUnits } from 'ethers/lib/utils';
import { getAddress } from '@ethersproject/address';

const ftmStakingRateProvider = getContractAt('0x629D4c27057915e59Dd94Bca8D48c6d80735B521', [
    {
        inputs: [],
        name: 'getRate',
        outputs: [{ internalType: 'uint256', name: '_rate', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
]);

export const SFTMX_ADDRESS = getAddress('0xd7028092c830b5c8fce061af2e593413ebbc1fc1');

export class StaderStakedFtmService {
    public async getStakedFtmPrice(ftmPrice: number): Promise<Price> {
        const rate = await ftmStakingRateProvider.getRate();
        const formmattedRate = formatUnits(rate);

        return {
            usd: parseFloat(formmattedRate) * ftmPrice,
        };
    }
}

export const staderStakedFtmService = new StaderStakedFtmService();
