import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { nestedPoolWithSingleLayerNesting } from '../../../prisma/prisma-types';
import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { subgraphToPrismaCreate } from '../../pool/subgraph-mapper';
import { PoolOnChainDataService } from '../../pool/lib/pool-on-chain-data.service';
import _ from 'lodash';

export const syncPoolsV2 = async (
    blockNumber: number,
    chain: Chain,
    vaultAddress: string,
    balancerQueriesAddress: string,
    yieldProtocolFeePercentage: string,
    swapProtocolFeePercentage: string,
    gyroConfig?: string,
): Promise<string[]> => {
    // Get all the pools
    const poolIds = (
        await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                NOT: {
                    categories: {
                        has: 'BLACK_LISTED',
                    },
                },
                chain,
            },
        })
    ).map((item) => item.id);

    const chunks = _.chunk(poolIds, 100);

    const poolOnChainDataService = new PoolOnChainDataService(() => ({
        vaultAddress,
        balancerQueriesAddress,
        yieldProtocolFeePercentage,
        swapProtocolFeePercentage,
        gyroConfig,
    }));

    const tokenPrices = await prisma.prismaTokenPrice.findMany({
        where: {
            chain,
        },
    });

    for (const chunk of chunks) {
        await poolOnChainDataService.updateOnChainStatus(chunk, chain);
        await poolOnChainDataService.updateOnChainData(chunk, chain, blockNumber, tokenPrices);
    }

    return poolIds;
};

const createPoolRecord = async (
    pool: BalancerPoolFragment,
    chain: Chain,
    blockNumber: number,
    nestedPools: { id: string; address: string }[],
) => {
    const poolTokens = pool.tokens || [];

    await prisma.prismaToken.createMany({
        skipDuplicates: true,
        data: [
            ...poolTokens.map((token) => ({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                chain,
            })),
            {
                address: pool.address,
                symbol: pool.symbol || '',
                name: pool.name || '',
                decimals: 18,
                chain,
            },
        ],
    });

    const prismaPoolRecordWithAssociations = subgraphToPrismaCreate(pool, chain, blockNumber, nestedPools);

    await prisma.prismaPool.create(prismaPoolRecordWithAssociations);

    await prisma.prismaPoolTokenDynamicData.createMany({
        data: poolTokens.map((token) => ({
            id: token.id,
            chain,
            poolTokenId: token.id,
            blockNumber,
            priceRate: token.priceRate || '1.0',
            weight: token.weight,
            balance: token.balance,
            balanceUSD: 0,
        })),
    });

    await createAllTokensRelationshipForPool(pool.id, chain);
};

const createAllTokensRelationshipForPool = async (poolId: string, chain: Chain): Promise<void> => {
    const pool = await prisma.prismaPool.findUnique({
        ...nestedPoolWithSingleLayerNesting,
        where: { id_chain: { id: poolId, chain } },
    });

    if (!pool) {
        return;
    }

    const allTokens = _.flattenDeep(
        pool.tokens.map((token) => [
            token,
            ...(token.nestedPool?.tokens || []).map((nestedToken) => ({
                ...nestedToken,
                nestedPoolId: token.nestedPool?.id || null,
            })),
        ]),
    );

    await prisma.prismaPoolExpandedTokens.createMany({
        skipDuplicates: true,
        data: allTokens.map((token) => ({
            poolId,
            chain,
            tokenAddress: token.address,
            nestedPoolId: token.nestedPoolId || null,
        })),
    });
};
