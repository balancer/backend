import { Contract } from '@ethersproject/contracts';
import { BigNumber } from 'ethers';
import { oldBnumFromBnum } from '../../big-number/old-big-number';
import { prisma } from '../../../prisma/prisma-client';

export class FbeetsService {
    constructor(private readonly fBeetsContract: Contract, private readonly fBeetsPoolContract: Contract) {}

    public async getRatio(): Promise<string> {
        const fbeets = await prisma.prismaFbeets.findFirst({});

        if (!fbeets) {
            throw new Error('Fbeets data has not yet been synced');
        }

        return fbeets.ratio;
    }

    public async syncRatio() {
        const totalSupply: BigNumber = await this.fBeetsContract.totalSupply();
        const bptBalance: BigNumber = await this.fBeetsPoolContract.balanceOf(this.fBeetsContract.address);

        const ratio = oldBnumFromBnum(bptBalance).div(oldBnumFromBnum(totalSupply)).toString();

        await prisma.prismaFbeets.upsert({
            where: { id: 'fbeets' },
            update: { ratio },
            create: { id: 'fbeets', ratio },
        });
    }
}
