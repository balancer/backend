import { TokenYieldHandler } from '../../types';
import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { getViemClient } from '../../../sources/viem-client';
import { formatEther, parseAbiItem, zeroAddress, Hex } from 'viem';
import { blockNumbers } from '../../../block-numbers';
import { daysAgo } from '../../../common/time';

const abi = [parseAbiItem('function getRate() view returns(uint)')];

export const rateProviderHandler: TokenYieldHandler = async ({
    chain,
    intervalInDays = 30,
}: {
    chain: Chain;
    intervalInDays: number;
}) => {
    try {
        const poolTokensWithRateProvider = await prisma.prismaPoolToken.findMany({
            where: {
                chain,
                AND: [
                    {
                        priceRateProvider: {
                            not: null,
                        },
                    },
                    {
                        priceRateProvider: {
                            not: zeroAddress,
                        },
                    },
                    {
                        priceRate: {
                            not: '1.0',
                        },
                    },
                    {
                        priceRate: {
                            not: '1',
                        },
                    },
                ],
                token: {
                    types: {
                        some: {
                            type: 'ERC4626',
                        },
                    },
                },
            },
            select: { address: true, priceRateProvider: true },
        });

        // Make tokens unique
        const uniqueTokens = poolTokensWithRateProvider.filter(
            (pt, idx, arr) => arr.findIndex((t) => t.address === pt.address) === idx,
        );

        const client = getViemClient(chain, { multicallBatch: true, jsonRpcBatch: true });

        const pastBlock = await blockNumbers().getBlock(chain, daysAgo(intervalInDays));

        if (!pastBlock) {
            return [];
        }

        const aprs = await Promise.allSettled(
            uniqueTokens.map(async ({ address, priceRateProvider }) => {
                const currentRate = await client.readContract({
                    address: priceRateProvider as Hex,
                    abi,
                    functionName: 'getRate',
                });

                const pastRate = await client.readContract({
                    address: priceRateProvider as Hex,
                    abi,
                    functionName: 'getRate',
                    blockNumber: BigInt(pastBlock),
                });

                const rateGrowth = currentRate - pastRate;

                const apr = parseFloat(formatEther(rateGrowth)) * (365 / intervalInDays);

                return {
                    address,
                    apr,
                };
            }),
        ).then((results) =>
            results
                .filter((r) => r.status === 'fulfilled')
                .map((r) => r.value)
                .filter((v) => v.apr > 0),
        );

        return aprs;
    } catch (error) {
        throw Error(`Rate provider APR hanlder failed: ${(error as Error).message}`);
    }
};
