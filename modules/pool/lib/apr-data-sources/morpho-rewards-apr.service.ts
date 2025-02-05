import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolAprItemGroup, PrismaPoolAprType } from '@prisma/client';
import { morphoApiClient } from './morpho-api-client';
import murmurhash from 'murmurhash';

const MORPHO_TOKEN = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';

export class MorphoRewardsAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'MorphoRewardsAprService';
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
        const morphoRewards = await morphoApiClient.rewardTokens();
        const morphoApr = await morphoApiClient.morphoApr();

        // Find all pools with Morpho vault tokens
        const morphoAddresses = Object.keys(morphoRewards);
        const poolsWithMorphoTokens = pools.filter((pool) => {
            return pool.tokens.find((token) => morphoAddresses.includes(token.address));
        });

        // For each of them get reward token APRs
        const aprItems = poolsWithMorphoTokens.flatMap((pool) => {
            const tokens = pool.tokens.filter((token) => morphoAddresses.includes(token.address));
            const tvl = pool.tokens.map((t) => t.balanceUSD).reduce((a, b) => a + b, 0);
            const morphoShare = tokens.map((t) => (tvl > 0 ? t.balanceUSD / tvl : 0)).reduce((a, b) => a + b, 0);

            const vaultRewards = tokens.flatMap((token) => {
                const rewardTokens = morphoRewards[token.address];
                const weight = token.balanceUSD / tvl;

                return rewardTokens.map((rewardToken) => ({
                    id: murmurhash.v3(`${pool.id}-${token.address}-${rewardToken.address}`).toString(36),
                    chain: pool.chain,
                    poolId: pool.id,
                    title: `${rewardToken.symbol} APR`,
                    apr: rewardToken.apr * weight,
                    group: PrismaPoolAprItemGroup.MORPHO,
                    type: PrismaPoolAprType.MERKL,
                    rewardTokenAddress: rewardToken.address,
                    rewardTokenSymbol: rewardToken.symbol,
                }));
            });

            // Each pool with Morpho vault is receiving a MORPHO token on top of the rewards
            const morphoAprItem = {
                id: murmurhash.v3(`${pool.id}-morpho`).toString(36),
                chain: pool.chain,
                poolId: pool.id,
                title: 'MORPHO APR',
                apr: morphoApr[pool.chain as keyof typeof morphoApr] * morphoShare,
                group: PrismaPoolAprItemGroup.MORPHO,
                type: PrismaPoolAprType.MERKL,
                rewardTokenAddress: MORPHO_TOKEN,
                rewardTokenSymbol: 'MORPHO',
            };

            return [...vaultRewards, morphoAprItem];
        });

        return aprItems;
    }
}
