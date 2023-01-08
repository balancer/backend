import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { PoolAprService } from '../../../pool-types';
import { GaugeSerivce } from '../../staking/optimism/gauge-service';
import { TokenService } from '../../../../token/token.service';
import { secondsPerYear } from '../../../../common/time';
import { PrismaPoolAprItem } from '@prisma/client';
import { prisma } from '../../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../../prisma/prisma-util';

export class GaugeAprService implements PoolAprService {
    constructor(
        private readonly gaugeService: GaugeSerivce,
        private readonly tokenService: TokenService,
        private readonly primaryTokens: string[],
    ) {}

    public getAprServiceName(): string {
        return 'GaugeAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const operations: any[] = [];
        const gaugeStreamers = await this.gaugeService.getStreamers();
        const tokenPrices = await this.tokenService.getTokenPrices();
        for (const pool of pools) {
            const streamer = gaugeStreamers.find(
                (streamer) => streamer.gaugeAddress === pool.staking?.gauge?.gaugeAddress,
            );
            if (!streamer || !pool.dynamicData) {
                continue;
            }
            const totalShares = parseFloat(pool.dynamicData.totalShares);
            const gaugeTvl =
                totalShares > 0
                    ? (parseFloat(streamer.totalSupply) / totalShares) * pool.dynamicData.totalLiquidity
                    : 0;

            let thirdPartyApr = 0;
            for (let rewardToken of streamer.rewardTokens) {
                const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, rewardToken.address) || 0.1;
                const rewardTokenPerYear = rewardToken.rewardsPerSecond * secondsPerYear;
                const rewardTokenValuePerYear = tokenPrice * rewardTokenPerYear;
                let rewardApr = gaugeTvl > 0 ? rewardTokenValuePerYear / gaugeTvl : 0;

                const isThirdPartyApr = !this.primaryTokens.includes(rewardToken.address);
                if (isThirdPartyApr) {
                    thirdPartyApr += rewardApr;
                }

                //TODO: remove reward apr for it's mai life (remove later)
                if (pool.id === '0x1f131ec1175f023ee1534b16fa8ab237c00e238100000000000000000000004a') {
                    rewardApr = 0;
                }

                const item: PrismaPoolAprItem = {
                    id: `${pool.id}-${rewardToken.symbol}-apr`,
                    poolId: pool.id,
                    title: `${rewardToken.symbol} reward APR`,
                    apr: rewardApr,
                    type: isThirdPartyApr ? 'THIRD_PARTY_REWARD' : 'NATIVE_REWARD',
                    group: null,
                };

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id: item.id },
                        update: item,
                        create: item,
                    }),
                );
            }
        }
        await prismaBulkExecuteOperations(operations);
    }
}
