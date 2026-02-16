import { prisma } from '../../../../prisma/prisma-client';
import { GraphQLError } from 'graphql';
import { Resolvers } from '../generated-schema';
import { validateLBPoolInput } from '../../../../modules/validators/lbpool-input-validator';
import { lbPoolInputToDB } from '../../../../modules/sources/transformers/lbpool-input-to-db';
import { priceChartData } from '../../../../modules/pool/lbp/price-chart-data';
import { LBPoolData } from '../../../../modules/pool/pool-data';

export default {
    Query: {
        /**
         * Get LB Pool price chart data
         */
        lbpPriceChart: async (parent: any, { id, chain, dataPoints }) => {
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
                    createTime: pool.createTime,
                    ...(pool.typeData as LBPoolData),
                };

                const chartData = await priceChartData(input, dataPoints || undefined);

                return chartData.map((d) => ({ ...d, intervalTimestamp: d.timestamp }));
            } catch (error) {
                console.error('Error fetching LB Pool chart:', error);
                return null;
            }
        },
    },
    Mutation: {
        createLBP: async (_: any, { input, type }) => {
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

            if (type && type !== 'LIQUIDITY_BOOTSTRAPPING' && type !== 'FIXED_LBP') {
                throw new GraphQLError('Invalid pool type', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                });
            }

            // Prepare DB data
            const { tokenData, poolData } = await lbPoolInputToDB(input, type ? type : 'LIQUIDITY_BOOTSTRAPPING');

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
                                ...((poolData.typeData as any) || {}),
                                ...((currentPool.typeData as any) || {}), // make sure that we dont allow to override the LBP metadata, otherwise anybody could override the pool with malicious metadata
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
