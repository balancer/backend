import { PoolAprService } from '../../../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { TokenService } from '../../../../token/token.service';
import { YearnVault } from '../apr-types';
import { networkContext } from '../../../../network/network-context.service';

export class YearnVaultAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService, private readonly vaultsEndpoint: string) {}

    public getAprServiceName(): string {
        return 'YearnVaultAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const { data } = await axios.get<YearnVault[]>(this.vaultsEndpoint);
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            const itemId = `${pool.id}-yearn-vault`;

            if (!pool.linearData || !pool.dynamicData) {
                continue;
            }

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];

            const vault = data.find((vault) => vault.address.toLowerCase() === wrappedToken.address.toLowerCase());

            if (!vault) {
                continue;
            }

            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? vault.apy.net_apy * (poolWrappedLiquidity / totalLiquidity) : 0;

            await prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: itemId, chain: networkContext.chain } },
                create: {
                    id: itemId,
                    chain: networkContext.chain,
                    poolId: pool.id,
                    title: `${vault.symbol} APR`,
                    apr,
                    group: 'YEARN',
                    type: 'LINEAR_BOOSTED',
                },
                update: { apr, group: 'YEARN', type: 'LINEAR_BOOSTED' },
            });
        }
    }
}
