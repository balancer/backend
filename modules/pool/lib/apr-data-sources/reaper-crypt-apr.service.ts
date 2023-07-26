import { isSameAddress } from '@balancer-labs/sdk';
import * as Sentry from '@sentry/node';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { tokenService } from '../../../token/token.service';
import { getContractAt } from '../../../web3/contract';
import { PoolAprService } from '../../pool-types';
import ReaperCryptAbi from './abi/ReaperCrypt.json';
import ReaperCryptStrategyAbi from './abi/ReaperCryptStrategy.json';
import { networkContext } from '../../../network/network-context.service';
import { liquidStakedBaseAprService } from './liquid-staked-base-apr.service';
import axios from 'axios';
import { Contract } from 'ethers';

type MultiStratQueryResponse = {
    data: {
        vault: {
            apr: string;
        };
    };
};

export class ReaperCryptAprService implements PoolAprService {
    private readonly APR_PERCENT_DIVISOR = 10_000;

    constructor(
        private readonly linearPoolFactories: string[],
        private readonly linearPoolsFromErc4626Factory: string[],
        private readonly averageAPRAcrossLastNHarvests: number,
        private readonly sFtmXAddress: string | undefined,
        private readonly wstEthAddress: string | undefined,
    ) {}

    public getAprServiceName(): string {
        return 'ReaperCryptAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await tokenService.getTokenPrices();

        for (const pool of pools) {
            if (
                (!this.linearPoolFactories.includes(pool.factory || '') &&
                    !this.linearPoolsFromErc4626Factory.includes(pool.id)) ||
                !pool.linearData ||
                !pool.dynamicData
            ) {
                continue;
            }
            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];

            const cryptContract = getContractAt(wrappedToken.address, ReaperCryptAbi);

            const cryptName = await cryptContract.name();

            let cryptApr = 0;
            let itemId = '';

            if (cryptName.includes('Multi-Strategy')) {
                cryptApr = await this.getMultiStrategyAprFromSubgraph(wrappedToken.address);
                itemId = `${pool.id}-reaper-mutlistrat`;
            } else {
                try {
                    cryptApr = await this.getSingleStrategyCryptApr(cryptContract);
                    itemId = `${pool.id}-reaper-crypt`;
                } catch (e) {
                    Sentry.captureException(e, {
                        tags: {
                            poolId: pool.id,
                            poolName: pool.name,
                            cryptContract: wrappedToken.address,
                        },
                    });
                    continue;
                }
            }

            const tokenPrice = tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData!.totalLiquidity;
            let apr = totalLiquidity > 0 ? cryptApr * (poolWrappedLiquidity / totalLiquidity) : 0;

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

            // if we have sftmx as the main token in this linear pool, we want to take the linear APR top level and
            // we also need to adapt the APR since the vault APR is denominated in sFTMx, so we need to apply the growth rate
            // and add the sftmx base apr to the unwrapped portion
            if (this.sFtmXAddress && isSameAddress(mainToken.address, this.sFtmXAddress)) {
                const baseApr = await liquidStakedBaseAprService.getSftmxBaseApr();
                if (baseApr > 0) {
                    const boostedVaultApr = this.getBoostedVaultApr(
                        totalLiquidity,
                        cryptApr,
                        baseApr,
                        poolWrappedLiquidity,
                    );

                    await prisma.prismaPoolAprItem.update({
                        where: { id_chain: { id: itemId, chain: networkContext.chain } },
                        data: {
                            apr: boostedVaultApr,
                        },
                    });
                }
            }

            if (this.wstEthAddress && isSameAddress(mainToken.address, this.wstEthAddress)) {
                const baseApr = await liquidStakedBaseAprService.getWstEthBaseApr();
                if (baseApr > 0) {
                    const boostedVaultApr = this.getBoostedVaultApr(
                        totalLiquidity,
                        cryptApr,
                        baseApr,
                        poolWrappedLiquidity,
                    );

                    await prisma.prismaPoolAprItem.update({
                        where: { id_chain: { id: itemId, chain: networkContext.chain } },
                        data: { apr: boostedVaultApr },
                    });
                }
            }
        }
    }

    private async getSingleStrategyCryptApr(cryptContract: Contract): Promise<number> {
        const cryptStrategyAddress = await cryptContract.strategy();

        const strategyContract = getContractAt(cryptStrategyAddress, ReaperCryptStrategyAbi);
        let avgAprAcrossXHarvests = 0;

        avgAprAcrossXHarvests =
            (await strategyContract.averageAPRAcrossLastNHarvests(this.averageAPRAcrossLastNHarvests)) /
            this.APR_PERCENT_DIVISOR;

        return avgAprAcrossXHarvests;
    }

    private async getMultiStrategyAprFromSubgraph(address: string): Promise<number> {
        const baseUrl = networkContext.data.reaper.multistratAprSubgraphUrl;

        const { data } = await axios.post<MultiStratQueryResponse>(baseUrl, {
            query: `query {
            vault(id: "${address}"){
              apr
            }
          }`,
        });

        if (data.data.vault && data.data.vault.apr) {
            return parseFloat(data.data.vault.apr);
        }
        return 0;
    }

    private getBoostedVaultApr(
        totalLiquidity: number,
        vaultHarvestApr: number,
        IbBaseApr: number,
        poolWrappedLiquidity: number,
    ) {
        return totalLiquidity > 0
            ? ((1 + vaultHarvestApr) * (1 + IbBaseApr) - 1) * (poolWrappedLiquidity / totalLiquidity)
            : 0;
    }
}
