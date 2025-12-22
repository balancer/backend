import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { CreateLbpInput } from '../../../apps/api/gql/generated-schema';
import { fetchLBPoolData } from '../contracts/fetch-lbpool-data';
import { prisma } from '../../../prisma/prisma-client';

export const lbPoolInputToDB = async (input: CreateLbpInput) => {
    const rpcData = await fetchLBPoolData(input.poolContract.address, input.poolContract.chain as Chain);

    // Get token prices
    const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            tokenAddress: {
                in: rpcData.tokens.map((token) => token.address),
            },
            chain: input.poolContract.chain as Chain,
        },
    });

    const prices = rpcData.pool.tokens.map(
        (token) => tokenPrices.find((p) => p.tokenAddress === token.address)?.price || 0,
    );

    // Parse data for the DB
    const projectToken = rpcData.pool.typeData.projectToken;
    const tokenData: Prisma.PrismaTokenCreateManyArgs['data'] = [
        // BPT token
        {
            address: input.poolContract.address.toLowerCase(),
            chain: input.poolContract.chain as Chain,
            symbol: rpcData.pool.symbol,
            name: rpcData.pool.name,
            logoURI: input.metadata.tokenLogo,
            decimals: 18,
        },
        ...rpcData.tokens.map((token) => ({
            ...token,
            chain: input.poolContract.chain as Chain,
            logoURI: (token.address === projectToken ? input.metadata.tokenLogo : '') || '',
        })),
    ];

    const poolTokensData: Prisma.PrismaPoolTokenCreateManyPoolInput[] = rpcData.pool.tokens.map((token, idx) => ({
        ...token,
        id: `${input.poolContract.address}-${token.address}`.toLowerCase(),
        balanceUSD: Number(token.balance) * prices[idx],
        priceRate: '1',
    }));

    const poolData: Prisma.PrismaPoolUpsertArgs['create'] = {
        ...rpcData.pool,
        id: input.poolContract.address.toLowerCase(),
        address: input.poolContract.address.toLowerCase(),
        chain: input.poolContract.chain.toUpperCase() as Chain,
        type: PrismaPoolType.LIQUIDITY_BOOTSTRAPPING,
        createTime: Math.floor(+new Date() / 1000),
        protocolVersion: 3,
        typeData: {
            ...rpcData.pool.typeData,
            ...input.metadata,
        },
        tokens: {
            createMany: {
                data: poolTokensData,
            },
        },
        dynamicData: {
            create: {
                ...rpcData.dynamicData,
                id: input.poolContract.address.toLowerCase(),
                totalLiquidity: poolTokensData.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
            },
        },
    };

    return {
        tokenData,
        poolData,
    };
};
