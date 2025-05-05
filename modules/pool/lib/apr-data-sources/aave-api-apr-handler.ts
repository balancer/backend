import _ from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import { PoolForAPRs } from '../../../../prisma/prisma-types';
import { PoolAprService } from '../../pool-types';
import { Chain } from '@prisma/client';
import { chainToChainId } from '../../../network/chain-id-to-chain';

type Incentives = {
    tokenInfo: ReserveToken;
    supplyIncentives: IncentiveInfo[];
};

type IncentiveInfo = {
    apr: number;
    rewardToken: Token;
};

type ReserveToken = Token & {
    supplyApr?: number;
};

export type Token = {
    symbol: string;
    address: string;
    book?: BookType;
};

export type BookType = {
    STATA_TOKEN?: string;
};

type AaveIncentive = {
    [key: string]: Incentives;
};

export class AaveApiAprService implements PoolAprService {
    base = 'https://apps.aavechan.com/api/aave-all-incentives?chainId=';

    public getAprServiceName(): string {
        return 'AaveApiAprServices';
    }

    public async updateAprForPools(pools: PoolForAPRs[]): Promise<void> {
        const aprItems = await this.getAprItemsForSupplyIncentives(pools);
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

    private async getAprItemsForSupplyIncentives(pools: PoolForAPRs[]): Promise<
        {
            id: string;
            chain: Chain;
            poolId: string;
            title: string;
            apr: number;
            type: 'MERKL';
            rewardTokenAddress: string;
            rewardTokenSymbol: string;
        }[]
    > {
        const poolsByChain = _.groupBy(pools, 'chain');

        const aprItems: {
            id: string;
            chain: Chain;
            poolId: string;
            title: string;
            apr: number;
            type: 'MERKL';
            rewardTokenAddress: string;
            rewardTokenSymbol: string;
        }[] = [];

        for (const chain in poolsByChain) {
            const aprItemsForChain = await this.fetchAprForChain(chainToChainId[chain], poolsByChain[chain]);
            aprItems.push(...aprItemsForChain);
            if (chain === 'MAINNET') {
                // also fetch lido prime instance items on mainnet
                const aprItemsForChain = await this.fetchAprForChain(`1&instance=prime`, poolsByChain[chain]);
                aprItems.push(...aprItemsForChain);
            }
        }

        return aprItems;
    }

    private async fetchAprForChain(chainId: string, pools: PoolForAPRs[]) {
        const aprItems: {
            id: string;
            chain: Chain;
            poolId: string;
            title: string;
            apr: number;
            type: 'MERKL';
            rewardTokenAddress: string;
            rewardTokenSymbol: string;
        }[] = [];

        const aaveIncentivesForChain = (await fetch(`${this.base}${chainId}`).then((res) =>
            res.json(),
        )) as AaveIncentive;

        for (const incentiveTokenName in aaveIncentivesForChain) {
            if (
                aaveIncentivesForChain[incentiveTokenName].tokenInfo.book?.STATA_TOKEN &&
                aaveIncentivesForChain[incentiveTokenName].supplyIncentives.length > 0
            ) {
                const incentivizedToken = aaveIncentivesForChain[
                    incentiveTokenName
                ].tokenInfo.book.STATA_TOKEN.toLowerCase()
                    .toString()
                    .toLowerCase();
                const supplyIncentivesForToken = aaveIncentivesForChain[incentiveTokenName].supplyIncentives;

                const poolsWithIncentivizedTokenToken = pools.filter((pool) =>
                    pool.tokens.find((token) => token.address === incentivizedToken),
                );

                for (const pool of poolsWithIncentivizedTokenToken) {
                    const tvl = pool.tokens.map((t) => t.balanceUSD).reduce((a, b) => a + b, 0);
                    const tokenTvl = pool.tokens.find((token) => token.address === incentivizedToken)?.balanceUSD || 0;

                    const tokenShareOfPoolTvl = tokenTvl === 0 || tvl === 0 ? 0 : tokenTvl / tvl;

                    for (const incentive of supplyIncentivesForToken) {
                        aprItems.push({
                            id: `${pool.id}-${incentivizedToken}-${incentive.rewardToken.address}`,
                            chain: pool.chain,
                            poolId: pool.id,
                            title: `${incentive.rewardToken.symbol} APR`,
                            apr: (incentive.apr / 100) * tokenShareOfPoolTvl,
                            type: 'MERKL',
                            rewardTokenAddress: incentive.rewardToken.address,
                            rewardTokenSymbol: incentive.rewardToken.symbol,
                        });
                    }
                }
            }
        }
        return aprItems;
    }
}

type VaultApr = Record<string, number>;
