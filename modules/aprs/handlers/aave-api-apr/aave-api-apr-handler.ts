import _ from 'lodash';
import { Chain, PrismaPoolAprItem } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';
import { AaveApiConfig } from '../types';
import { AaveChanClientInterface, AaveChanResponse, AaveChanClient } from './aave-chan-client';

/**
 * Implementation of AprHandler for Aave API
 */
export class AaveApiAprHandler implements AprHandler {
    private client: AaveChanClientInterface;

    constructor(
        private readonly config: AaveApiConfig,
        injectedClient?: AaveChanClientInterface,
    ) {
        // Create a default client if not present
        this.client = injectedClient || new AaveChanClient(this.config);
    }

    public getAprServiceName(): string {
        return 'AaveApiAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        // Fetch incentives for this chain
        const aaveIncentives = await this.client.fetchIncentives(this.config.chainId);
        const incentiveItems = await this.processIncentives(pools, aaveIncentives);
        aprItems.push(...incentiveItems);

        // For mainnet, also fetch prime instance items
        if (this.config.chainId === 1) {
            const primeIncentives = await this.client.fetchPrimeIncentives();
            const primeItems = await this.processIncentives(pools, primeIncentives);
            aprItems.push(...primeItems);
        }

        return aprItems;
    }

    private async processIncentives(
        pools: PoolAPRData[],
        incentives: AaveChanResponse,
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        for (const incentiveTokenName in incentives) {
            if (
                incentives[incentiveTokenName].tokenInfo.book?.STATA_TOKEN &&
                incentives[incentiveTokenName].supplyIncentives.length > 0
            ) {
                const incentivizedToken = incentives[incentiveTokenName].tokenInfo.book.STATA_TOKEN.toLowerCase()
                    .toString()
                    .toLowerCase();

                const supplyIncentivesForToken = incentives[incentiveTokenName].supplyIncentives;

                const poolsWithIncentivizedToken = pools.filter((pool) =>
                    pool.tokens.find((token) => token.address === incentivizedToken),
                );

                for (const pool of poolsWithIncentivizedToken) {
                    const tvl = pool.tokens.map((t) => t.balanceUSD).reduce((a, b) => a + b, 0);
                    const tokenTvl = pool.tokens.find((token) => token.address === incentivizedToken)?.balanceUSD || 0;

                    const tokenShareOfPoolTvl = tokenTvl === 0 || tvl === 0 ? 0 : tokenTvl / tvl;

                    for (const incentive of supplyIncentivesForToken) {
                        aprItems.push({
                            id: `${pool.id}-${incentivizedToken}-${incentive.rewardToken.address}`,
                            chain: pool.chain as Chain,
                            poolId: pool.id,
                            title: `${incentive.rewardToken.symbol} APR`,
                            apr: (incentive.apr / 100) * tokenShareOfPoolTvl,
                            type: 'MERKL',
                            rewardTokenAddress: incentive.rewardToken.address,
                            rewardTokenSymbol: incentive.rewardToken.symbol,
                            group: null,
                        });
                    }
                }
            }
        }

        return aprItems;
    }
}
