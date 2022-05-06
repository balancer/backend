import { PoolAprService } from '../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import axios from 'axios';
import { TokenPriceService } from '../../token-price/token-price.service';
import { prisma } from '../../util/prisma-client';

const BOO_TOKEN_ADDRESS = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE'.toLowerCase();

export class SpookySwapAprService implements PoolAprService {
    constructor(private readonly tokenPriceService: TokenPriceService) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenPriceService.getTokenPrices();
        const { data } = await axios.get<string>('https://api.spookyswap.finance/api/xboo', {});
        const xBooApr = parseFloat(data) / 100;
        let operations: any[] = [];

        for (const pool of pools) {
            for (const poolToken of pool.tokens) {
                const nestedPool = poolToken.nestedPool;
                const linearData = poolToken.nestedPool?.linearData;

                if (nestedPool && linearData && nestedPool.tokens[linearData.mainIndex].address === BOO_TOKEN_ADDRESS) {
                    const tokenPrice = this.tokenPriceService.getPriceForToken(tokenPrices, BOO_TOKEN_ADDRESS);
                    const wrappedToken = nestedPool.tokens[linearData.wrappedIndex];
                    const percentOfSupplyInPool =
                        parseFloat(poolToken.dynamicData?.balance || '0') /
                        parseFloat(nestedPool.dynamicData?.totalShares || '1');

                    const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0') * percentOfSupplyInPool;
                    const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
                    const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;

                    if (pool.id === '0x302b8b64795b064cadc32f74993a6372498608070001000000000000000003e0') {
                        console.log('poolTokens', JSON.stringify(nestedPool.tokens, null, 4));
                        console.log('wrappedToken', wrappedToken);
                        console.log('percentOfSupplyInPool', percentOfSupplyInPool);
                        console.log('poolWrappedLiquidity', poolWrappedLiquidity);
                    }

                    const apr =
                        pool.dynamicData && pool.dynamicData.totalLiquidity > 0
                            ? xBooApr * (poolWrappedLiquidity / pool.dynamicData.totalLiquidity)
                            : 0;

                    operations.push(
                        prisma.prismaPoolAprItem.upsert({
                            where: { id: `${pool.id}-xboo-apr` },
                            update: { apr },
                            create: {
                                id: `${pool.id}-xboo-apr`,
                                poolId: pool.id,
                                apr,
                                title: 'xBOO boosted APR',
                            },
                        }),
                    );
                }
            }
        }

        await prisma.$transaction(operations);
    }
}
