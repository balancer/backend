import { BigNumber } from 'ethers';
import { oldBnumFromBnum } from '../../big-number/old-big-number';
import { prisma } from '../../../prisma/prisma-client';
import { getContractAtForNetwork } from '../../web3/contract';
import { networkContext } from '../../network/network-context.service';
import FreshBeetsAbi from '../abi/FreshBeets.json';
import ERC20 from '../abi/ERC20.json';

export class FbeetsService {
    constructor() {}

    public async getRatio(): Promise<string> {
        if (!networkContext.isFantomNetwork) {
            return '1.0';
        }

        const fbeets = await prisma.prismaFbeets.findFirst({});
        if (!fbeets) {
            throw new Error('Fbeets data has not yet been synced');
        }

        return fbeets.ratio;
    }

    public async syncRatio() {
        if (!networkContext.data.fbeets) {
            return;
        }

        const fBeetsContract = getContractAtForNetwork(
            networkContext.data.fbeets.address,
            FreshBeetsAbi,
            networkContext.provider,
        );
        const fBeetsPoolContract = getContractAtForNetwork(
            networkContext.data.fbeets.poolAddress,
            ERC20,
            networkContext.provider,
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
