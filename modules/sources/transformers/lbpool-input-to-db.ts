import { Chain, Prisma } from '@prisma/client';
import { CreateLbpInput, GqlPoolType } from '../../../apps/api/gql/generated-schema';
import { fetchLBPoolData, LBPoolData } from '../contracts/fetch-lbpool-data';
import { prisma } from '../../../prisma/prisma-client';
import { fetchFixedLBPoolData, FixedLBPoolData } from '../contracts';
import { getViemClient } from '../../sources/viem-client';
import { formatUnits } from 'viem';

export const lbPoolInputToDB = async (input: CreateLbpInput, type: GqlPoolType) => {
    let rpcData: FixedLBPoolData | LBPoolData;
    if (type === 'LIQUIDITY_BOOTSTRAPPING') {
        rpcData = await fetchLBPoolData(input.poolContract.address, input.poolContract.chain as Chain);
    } else {
        rpcData = await fetchFixedLBPoolData(input.poolContract.address, input.poolContract.chain as Chain);
    }

    // we need to query the version of the LBP via onchain call
    const viemClient = getViemClient(input.poolContract.chain as Chain);
    const versionString = await viemClient.readContract({
        address: input.poolContract.address as `0x${string}`,
        abi: [
            {
                inputs: [],
                stateMutability: 'view',
                type: 'function',
                name: 'version',
                outputs: [
                    {
                        internalType: 'string',
                        name: '',
                        type: 'string',
                    },
                ],
            },
        ],
        functionName: 'version',
    });
    const version = JSON.parse(versionString) as {
        name: string;
        version: string;
        deployment: string;
    };

    let reserveTokenVirtualBalance = '0';
    if (version.version > '3') {
        const initialReserveTokenVirtualBalanceRaw = await viemClient.readContract({
            address: input.poolContract.address as `0x${string}`,
            abi: [
                {
                    inputs: [],
                    name: 'getReserveTokenVirtualBalance',
                    outputs: [
                        { internalType: 'uint256', name: '', type: 'uint256' },
                        { internalType: 'uint256', name: '', type: 'uint256' },
                    ],
                    stateMutability: 'view',
                    type: 'function',
                },
            ],
            functionName: 'getReserveTokenVirtualBalance',
        });

        const reserveDecimals =
            rpcData.tokens.find((token) => token.address === rpcData.pool.typeData.reserveToken)?.decimals ?? 18;
        reserveTokenVirtualBalance = formatUnits(initialReserveTokenVirtualBalanceRaw[0] ?? 0n, reserveDecimals);
    }

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
            address: token.address.toLowerCase(),
            chain: input.poolContract.chain as Chain,
            logoURI: (token.address.toLowerCase() === projectToken.toLowerCase() ? input.metadata.tokenLogo : '') || '',
        })),
    ];

    const poolTokensData: Prisma.PrismaPoolTokenCreateManyPoolInput[] = rpcData.pool.tokens.map((token, idx) => ({
        ...token,
        id: `${input.poolContract.address}-${token.address}`.toLowerCase(),
        address: token.address.toLowerCase(),
        balanceUSD: Number(token.balance) * prices[idx],
        priceRate: '1',
    }));

    const poolData: Prisma.PrismaPoolUpsertArgs['create'] = {
        ...rpcData.pool,
        version: parseFloat(version.version),
        id: input.poolContract.address.toLowerCase(),
        address: input.poolContract.address.toLowerCase(),
        chain: input.poolContract.chain.toUpperCase() as Chain,
        type: type,
        createTime: Math.floor(+new Date() / 1000),
        protocolVersion: 3,
        typeData: {
            ...rpcData.pool.typeData,
            ...input.metadata,
            reserveTokenVirtualBalance,
            initialReserveTokenVirtualBalance: reserveTokenVirtualBalance,
            isSeedless: Number(reserveTokenVirtualBalance) > 0,
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
