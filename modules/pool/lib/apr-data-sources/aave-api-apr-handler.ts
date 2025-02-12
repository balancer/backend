import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { BeefyAprConfig } from '../../../network/apr-config-types';
import { PoolAprService } from '../../pool-types';
import { AprHandler } from './yb-apr-handlers/types';
import axios from 'axios';

export class AaveApiAprService implements PoolAprService {
    // tokens: {
    //     [tokenName: string]: {
    //         address: string;
    //         vaultId: string;
    //         isIbYield?: boolean;
    //     };
    // };
    // sourceUrl: string;
    // group = 'AAVE';

    base = 'https://api.beefy.finance/aave/apr';

    public getAprServiceName(): string {
        return 'AaveApiAprServices';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const aprItems = await this.getAprItems(pools);

        await prisma.$transaction(
            aprItems.map((item) =>
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: item.id, chain: item.chain } },
                    update: {
                        apr: item.apr,
                    },
                    create: item,
                }),
            ),
        );
    }

    private async getAprItems(pools: PrismaPoolWithTokens[]) {
        // Get Morpho rewards
    }
}

type VaultApr = Record<string, number>;
