import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { GraphQLError } from 'graphql';
import { CreateLbpInput, Resolvers } from '../generated-schema';
import { validateLBPoolInput } from '../../../../modules/validators/lbpool-input-validator';
import { lbPoolInputToDB } from '../../../../modules/sources/transformers/lbpool-input-to-db';
import { priceChartData } from '../../../../modules/pool/lbp/price-chart-data';
import { LBPoolData } from '../../../../modules/pool/pool-data';

export default {
    Query: {
        /**
         * Get LB Pool price chart data
         */
        lbpPriceChart: async (parent: any, { id, chain, interval }) => {
            try {
                const pool = await prisma.prismaPool.findFirst({
                    where: {
                        id,
                        chain,
                        type: 'LIQUIDITY_BOOTSTRAPPING',
                        protocolVersion: 3,
                    },
                });
                if (!pool) {
                    throw new GraphQLError('Pool with id does not exist', { extensions: { code: 'NOT_FOUND' } });
                }
                const input = {
                    id: pool.id,
                    chain: pool.chain,
                    ...(pool.typeData as LBPoolData),
                };
                return await priceChartData(input);
            } catch (error) {
                console.error('Error fetching LB Pool chart:', error);
                return null;
            }
        },
    },
    Mutation: {
        createLBP: async (_: any, { input }: { input: CreateLbpInput }) => {
            // Validate input
            const parsedInput = await validateLBPoolInput(input);
            if (!parsedInput.success) {
                throw new GraphQLError('Invalid input', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        errors: parsedInput.error.errors,
                    },
                });
            }

            // Prepare DB data
            const { tokenData, poolData } = await lbPoolInputToDB(input);

            try {
                // Create tokens
                await prisma.prismaToken.createMany({
                    data: tokenData,
                    skipDuplicates: true,
                });

                // Does pool exists?
                const currentPool = await prisma.prismaPool.findFirst({
                    where: {
                        id: poolData.address,
                        chain: poolData.chain,
                    },
                });
                if (currentPool) {
                    const record = await prisma.prismaPool.update({
                        where: {
                            id_chain: {
                                id: poolData.id,
                                chain: poolData.chain,
                            },
                        },
                        data: {
                            typeData: {
                                ...((currentPool.typeData as any) || {}),
                                ...((poolData.typeData as any) || {}),
                            },
                        },
                    });
                    return !!record;
                } else {
                    // Create pool
                    const record = await prisma.prismaPool.create({
                        data: poolData,
                    });
                    return !!record;
                }
            } catch (error) {
                console.error(error);
                throw new GraphQLError('Error saving data', {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                });
            }
        },
    },
} as Resolvers;
