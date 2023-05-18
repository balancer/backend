import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { networkContext } from '../../../network/network-context.service';
import { TokenService } from '../../../token/token.service';
import { PoolAprService } from '../../pool-types';
import axios from 'axios';

type QueryResponse = {
    data: {
        vault: {
            apr: string;
        };
    };
};

export class ReaperMultistratAprService implements PoolAprService {
    constructor(
        private readonly reaperMultiStratLinearPoolIds: string[],
        private readonly tokenService: TokenService,
    ) {}

    public getAprServiceName(): string {
        return 'ReaperMultistratAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            if (!this.reaperMultiStratLinearPoolIds.includes(pool.id) || !pool.linearData || !pool.dynamicData) {
                continue;
            }

            const itemId = `${pool.id}-reaper-mutlistrat`;

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];

            const baseApr = await this.getBaseAprFromSubgraph(wrappedToken.address);

            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            let apr = totalLiquidity > 0 ? parseFloat(baseApr) * (poolWrappedLiquidity / totalLiquidity) : 0;

            await prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: itemId, chain: networkContext.chain } },
                create: {
                    id: itemId,
                    chain: networkContext.chain,
                    poolId: pool.id,
                    title: `${wrappedToken.token.symbol} APR`,
                    apr: apr,
                    group: 'REAPER',
                    type: 'LINEAR_BOOSTED',
                },
                update: { title: `${wrappedToken.token.symbol} APR`, apr: apr },
            });
        }
    }

    private async getBaseAprFromSubgraph(address: string): Promise<string> {
        const baseUrl = 'https://api.thegraph.com/subgraphs/name/byte-masons/multi-strategy-vaults-fantom';

        const { data } = await axios.post<QueryResponse>(baseUrl, {
            query: `query {
                vault(id: "${address}"){
                  apr
                }
              }`,
        });

        if (data.data.vault && data.data.vault.apr) {
            return data.data.vault.apr;
        }
        return '0';
    }
}
