import { isSameAddress } from '@balancer-labs/sdk';
import * as Sentry from '@sentry/node';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { TokenService } from '../../../token/token.service';
import { getContractAt } from '../../../web3/contract';
import { PoolAprService } from '../../pool-types';
import BeefyWrapper from './abi/BeefyWrapper.json';
import axios from 'axios';
import moment from 'moment-timezone';
import { networkContext } from '../../../network/network-context.service';

interface VaultInformation {
    id: string;
    name: string;
    token: string;
    tokenAddress: string;
    tokenDecimals: number;
    earnedToken: string;
    earnedTokenAddress: string;
    earnContractAddress: string;
    oracle: string;
    oracleId: string;
    status: string;
    platformId: string;
    assets: string[];
    risks: string[];
    strategyTypeId: string;
    buyTokenUrl: string;
    network: string;
    createdAt: number;
    chain: string;
    strategy: string;
    lastHarvest: number;
    pricePerFullShare: string;
}

type VaultApr = Record<
    string,
    {
        vaultApr: number;
        compoundingsPerYear: number;
        beefyPerformanceFee: number;
        vaultApy: number;
        lpFee: number;
        tradingApr: number;
        totalApy: number;
    }
>;

export class BeefyVaultAprService implements PoolAprService {
    constructor(private readonly beefyLinearPools: string[], private readonly tokenService: TokenService) {}

    public getAprServiceName(): string {
        return 'BeefyVaultAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();

        for (const pool of pools) {
            if (!this.beefyLinearPools.includes(pool.id || '') || !pool.linearData || !pool.dynamicData) {
                continue;
            }

            const itemId = `${pool.id}-beefy-vault`;

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const mainToken = pool.tokens[linearData.mainIndex];

            const beefyWrapper = getContractAt(wrappedToken.address, BeefyWrapper);
            const beefyVaultAddress: string = await beefyWrapper.vault();

            const beefyVaultBaseApr = await this.getBeefyVaultBaseApr(beefyVaultAddress);

            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, mainToken.address);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            let apr = totalLiquidity > 0 ? beefyVaultBaseApr * (poolWrappedLiquidity / totalLiquidity) : 0;

            await prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: itemId, chain: networkContext.chain } },
                create: {
                    id: itemId,
                    chain: networkContext.chain,
                    poolId: pool.id,
                    title: `${wrappedToken.token.symbol} APR`,
                    apr: apr,
                    group: 'BEEFY',
                    type: 'LINEAR_BOOSTED',
                },
                update: { title: `${wrappedToken.token.symbol} APR`, apr: apr },
            });
        }
    }

    private async getBeefyVaultBaseApr(beefyVaultAddress: string): Promise<number> {
        const vaultEndpoint = 'https://api.beefy.finance/vaults?_=';
        const aprEndpoint = 'https://api.beefy.finance/apy/breakdown?_=';

        const now = moment().startOf('minute').unix();

        const { data: vaultData } = await axios.get<VaultInformation[]>(vaultEndpoint + `${now}`);
        const beefyVault = vaultData.find((vault) => isSameAddress(vault.earnContractAddress, beefyVaultAddress));

        if (beefyVault?.id) {
            const { data: aprData } = await axios.get<VaultApr>(aprEndpoint + `${now}`);
            return aprData[beefyVault.id].vaultApr;
        }
        return 0;
    }
}
