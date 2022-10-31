import { isSameAddress } from '@balancer-labs/sdk';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { TokenService } from '../../../token/token.service';
import { getContractAt } from '../../../web3/contract';
import { PoolAprService } from '../../pool-types';
import ReaperCryptAbi from './abi/ReaperCrypt.json';
import ReaperCryptStrategyAbi from './abi/ReaperCryptStrategy.json';

export class ReaperCryptAprService implements PoolAprService {
    private readonly APR_PERCENT_DIVISOR = 10_000;

    private readonly SFTMX_ADDRESS = '0xd7028092c830b5c8fce061af2e593413ebbc1fc1';
    private readonly SFTMX_APR = 0.046;

    constructor(
        private readonly linearPoolFactories: string[],
        private readonly averageAPRAcrossLastNHarvests: number,
        private readonly tokenService: TokenService,
    ) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            if (!this.linearPoolFactories.includes(pool.factory || '') || !pool.linearData || !pool.dynamicData) {
                continue;
            }

            const itemId = `${pool.id}-reaper-crypt`;

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];

            const cryptContract = getContractAt(wrappedToken.address, ReaperCryptAbi);
            const cryptStrategyAddress = await cryptContract.strategy();
            const strategyContract = getContractAt(cryptStrategyAddress, ReaperCryptStrategyAbi);
            const avgAprAcrossXHarvests =
                (await strategyContract.averageAPRAcrossLastNHarvests(this.averageAPRAcrossLastNHarvests)) /
                this.APR_PERCENT_DIVISOR;

            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            let apr = totalLiquidity > 0 ? avgAprAcrossXHarvests * (poolWrappedLiquidity / totalLiquidity) : 0;

            await prisma.prismaPoolAprItem.upsert({
                where: { id: itemId },
                create: {
                    id: itemId,
                    poolId: pool.id,
                    title: `${wrappedToken.token.symbol} APR`,
                    apr: apr,
                    group: 'REAPER',
                    type: 'LINEAR_BOOSTED',
                },
                update: { title: `${wrappedToken.token.symbol} APR`, apr: apr },
            });

            // if we have sftmx as the main token in this linear pool, we want to take the linear APR top level and
            // we also need to adapt the APR since the vault APR is denominated in sFTMx, so we need to apply the growth rate
            // and add the sftmx base apr to the unwrapped portion
            if (isSameAddress(mainToken.address, this.SFTMX_ADDRESS)) {
                const vaultApr =
                    totalLiquidity > 0
                        ? ((1 + avgAprAcrossXHarvests) * (1 + this.SFTMX_APR) - 1) *
                          (poolWrappedLiquidity / totalLiquidity)
                        : 0;
                const sFtmXApr =
                    totalLiquidity > 0
                        ? (this.SFTMX_APR * (totalLiquidity - poolWrappedLiquidity)) / totalLiquidity
                        : 0;
                apr = vaultApr + sFtmXApr;
                await prisma.prismaPoolAprItem.update({
                    where: { id: itemId },
                    data: { group: null, apr: apr, title: 'Boosted sFTMx APR' },
                });
            }
        }
    }
}
