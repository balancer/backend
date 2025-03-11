import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { ViemClient } from '../../sources/viem-client';
import { getChangedAddresses } from '../../sources/logs/get-changed-addresses';

const events = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenIn',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenOut',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountIn',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountOut',
                type: 'uint256',
            },
        ],
        name: 'LOG_SWAP',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenIn',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountIn',
                type: 'uint256',
            },
        ],
        name: 'LOG_JOIN',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenOut',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountOut',
                type: 'uint256',
            },
        ],
        name: 'LOG_EXIT',
        type: 'event',
    },
] as const;

export const fetchChangedPools = async (
    viemClient: ViemClient,
    chain: Chain,
    fromBlock: number,
    toBlock: number,
    maxBlockRange: number,
) => {
    const poolIds = await prisma.prismaPool
        .findMany({
            where: {
                chain,
                type: 'COW_AMM',
            },
            select: {
                id: true,
            },
        })
        .then((pools) => pools.map((pool) => pool.id));

    return getChangedAddresses(poolIds, events, viemClient, fromBlock, toBlock, maxBlockRange);
};
