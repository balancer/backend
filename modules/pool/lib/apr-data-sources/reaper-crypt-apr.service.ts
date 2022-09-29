import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { TokenService } from '../../../token/token.service';
import { getContractAt } from '../../../web3/contract';
import { PoolAprService } from '../../pool-types';
import ReaperCryptAbi from './abi/ReaperCrypt.json';
import ReaperCryptStrategyAbi from './abi/ReaperCryptStrategy.json';

export class ReaperCryptAprService implements PoolAprService {
    private readonly APR_PERCENT_DIVISOR = 10_000;

    constructor(private readonly linearPoolFactory: string, private readonly tokenService: TokenService) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            if (pool.factory !== this.linearPoolFactory || !pool.linearData || !pool.dynamicData) {
                continue;
            }

            const itemId = `${pool.id}-reaper-crypt`;

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];

            const cryptContract = getContractAt(wrappedToken.address, ReaperCryptAbi);
            const cryptStrategyAddress = await cryptContract.strategy();
            const strategyContract = getContractAt(cryptStrategyAddress, ReaperCryptStrategyAbi);
            const avgAprAcross5Harvests =
                (await strategyContract.averageAPRAcrossLastNHarvests(5)) / this.APR_PERCENT_DIVISOR;

            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? avgAprAcross5Harvests * (poolWrappedLiquidity / totalLiquidity) : 0;

            await prisma.prismaPoolAprItem.upsert({
                where: { id: itemId },
                create: {
                    id: itemId,
                    poolId: pool.id,
                    title: `${pool.symbol} APR`,
                    apr: apr,
                    group: 'REAPER',
                    type: 'LINEAR_BOOSTED',
                },
                update: { apr: apr },
            });
        }
    }
}
