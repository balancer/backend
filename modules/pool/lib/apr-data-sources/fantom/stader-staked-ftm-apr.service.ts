import { getAddress } from '@ethersproject/address';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { TokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';

export class StaderStakedFtmAprService implements PoolAprService {
    private readonly SFTMX_ADDRESS = getAddress('0xd7028092c830b5c8fce061af2e593413ebbc1fc1');

    constructor(private readonly tokenService: TokenService) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const sftmxPrice = this.tokenService.getPriceForToken(tokenPrices, this.SFTMX_ADDRESS);
        let operations: any[] = [];

        for (const pool of pools) {
            const sftmxBalance = pool.tokens.find((token) => token.address === this.SFTMX_ADDRESS)?.dynamicData
                ?.balance;
            if (sftmxBalance && pool.dynamicData) {
                const sftmxPercentage = (parseFloat(sftmxBalance) * sftmxPrice) / pool.dynamicData.totalLiquidity;
                const sftmxApr = 0.125 * sftmxPercentage;
                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id: `${pool.id}-sftmx-apr` },
                        update: { apr: sftmxApr, type: 'IB_YIELD' },
                        create: {
                            id: `${pool.id}-sftmx-apr`,
                            poolId: pool.id,
                            apr: sftmxApr,
                            title: 'sFTMx APR',
                            type: 'IB_YIELD',
                        },
                    }),
                );
            }
        }
        await Promise.all(operations);
    }
}
