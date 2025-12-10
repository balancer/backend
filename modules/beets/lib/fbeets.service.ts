import { BigNumber } from 'ethers';
import { oldBnumFromBnum } from '../../big-number/old-big-number';
import { prisma } from '../../../prisma/prisma-client';
import { getContractAtForNetwork } from '../../web3/contract';
import FreshBeetsAbi from '../abi/FreshBeets.json';
import ERC20 from '../abi/ERC20.json';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';

export class FbeetsService {
    constructor() {}

    public async getRatio(): Promise<string> {
        const fbeets = await prisma.prismaFbeets.findFirst({});
        if (!fbeets) {
            throw new Error('Fbeets data has not yet been synced');
        }

        return fbeets.ratio;
    }

    public async syncRatio() {
        const fantomNetworkConfig = AllNetworkConfigsKeyedOnChain['FANTOM'];
        if (!fantomNetworkConfig.data.fbeets) {
            return;
        }

        const fBeetsContract = getContractAtForNetwork(
            fantomNetworkConfig.data.fbeets.address,
            FreshBeetsAbi,
            fantomNetworkConfig.provider,
        );
        const fBeetsPoolContract = getContractAtForNetwork(
            fantomNetworkConfig.data.fbeets.poolAddress,
            ERC20,
            fantomNetworkConfig.provider,
        );

        const totalSupply: BigNumber = await fBeetsContract.totalSupply();
        const bptBalance: BigNumber = await fBeetsPoolContract.balanceOf(fBeetsContract.address);

        const ratio = oldBnumFromBnum(bptBalance).div(oldBnumFromBnum(totalSupply)).toString();

        await prisma.prismaFbeets.upsert({
            where: { id: 'fbeets' },
            update: { ratio },
            create: { id: 'fbeets', ratio },
        });
    }
}
