import { PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { morphoApiClient } from './morpho-api-client';
import { AprHandler, PoolAPRData } from '../../types';
// IDs can be converted to hashes for DB perf optimization
// import murmurhash from 'murmurhash';

export class MorphoRewardsAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'MorphoRewardsAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        // Get Morpho aprs
        const morphoApr = await morphoApiClient.morphoApr();

        // Find all pools with Morpho vault tokens
        const morphoVaultAddresses = Object.keys(morphoApr);
        const poolsWithMorphoTokens = pools.filter((pool) => {
            return pool.tokens.find((token) => morphoVaultAddresses.includes(token.address));
        });

        // For each of them get reward token APRs
        const aprItems = poolsWithMorphoTokens.flatMap((pool) => {
            const tokens = pool.tokens.filter((token) => morphoVaultAddresses.includes(token.address));
            const tvl = pool.tokens.map((t) => t.balanceUSD).reduce((a, b) => a + b, 0);

            const vaultRewards = tokens.flatMap((token) => {
                const vaultApr = morphoApr[token.address];
                const weight = token.balanceUSD / tvl || 0;

                return {
                    // id: murmurhash.v3(`${pool.id}-${token.address}-${rewardToken.address}`).toString(36),
                    id: `${pool.id}-morphovault-rewards`,
                    chain: pool.chain,
                    poolId: pool.id,
                    title: 'MORPHO VAULT APR',
                    apr: vaultApr.rewardApy * weight,
                    type: PrismaPoolAprType.MERKL,
                    rewardTokenAddress: null,
                    rewardTokenSymbol: null,
                    group: null,
                };
            });

            return vaultRewards;
        });

        return aprItems;
    }
}
