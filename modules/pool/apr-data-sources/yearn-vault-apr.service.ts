import { PoolAprService } from '../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { GqlBalancePoolAprSubItem } from '../../../schema';
import { TokenPriceService } from '../../token-price/token-price.service';
import _ from 'lodash';
import axios from 'axios';
import { YearnVault } from '../../boosted/yearn-types';
import { env } from '../../../app/env';
import { PrismaPoolAprItem } from '@prisma/client';
import { prisma } from '../../util/prisma-client';
import { TokenService } from '../../token/token.service';

export class YearnVaultAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const { data } = await axios.get<YearnVault[]>(env.YEARN_VAULTS_ENDPOINT);
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            const itemId = `${pool.id}-yearn-vault`;
            const subItems: PrismaPoolAprItem[] = [];

            for (const poolToken of pool.tokens) {
                if (!poolToken.nestedPool || !poolToken.nestedPool.linearData) {
                    continue;
                }

                const nestedPool = poolToken.nestedPool;
                const linearData = poolToken.nestedPool.linearData;
                const wrappedToken = nestedPool.tokens[linearData.wrappedIndex];
                const mainToken = nestedPool.tokens[linearData.mainIndex];
                const percentOfSupplyInPool =
                    parseFloat(poolToken.dynamicData?.balance || '0') /
                    parseFloat(nestedPool.dynamicData?.totalShares || '1');

                const vault = data.find((vault) => vault.address.toLowerCase() === wrappedToken.address.toLowerCase());

                if (!vault) {
                    continue;
                }

                const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
                const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0') * percentOfSupplyInPool;
                const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
                const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;

                subItems.push({
                    id: `${pool.id}-yearn-vault-${vault.symbol}`,
                    poolId: pool.id,
                    title: `${vault.symbol} APR`,
                    apr:
                        pool.dynamicData && pool.dynamicData.totalLiquidity > 0
                            ? vault.apy.net_apy * (poolWrappedLiquidity / pool.dynamicData.totalLiquidity)
                            : 0,
                    isSwapApr: false,
                    isThirdPartyApr: true,
                    isNativeRewardApr: false,
                    parentItemId: `${pool.id}-yearn-vault`,
                });
            }

            if (subItems.length > 0) {
                const apr = _.sumBy(subItems, 'apr');

                await prisma.prismaPoolAprItem.upsert({
                    where: { id: itemId },
                    create: { id: itemId, poolId: pool.id, title: 'Yearn boosted APR', apr },
                    update: { apr },
                });

                for (const subItem of subItems) {
                    await prisma.prismaPoolAprItem.upsert({
                        where: { id: subItem.id },
                        create: subItem,
                        update: subItem,
                    });
                }
            }
        }
    }
}
