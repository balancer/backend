import { prisma } from '../../../../prisma/prisma-client';
import { GraphQLError } from 'graphql';
import { CreateLbpInput, Resolvers } from '../generated-schema';
import { validateLBPoolInput } from '../../../../modules/validators/lbpool-input-validator';
import { lbPoolInputToDB } from '../../../../modules/sources/transformers/lbpool-input-to-db';

export default {
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

                // Create pool
                const record = await prisma.prismaPool.upsert({
                    where: {
                        address_chain: {
                            address: poolData.address,
                            chain: poolData.chain,
                        },
                    },
                    // If the record already exists, we do not update it.
                    update: {},
                    create: poolData,
                });
                return !!record;
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
    Query: {},
} as Resolvers;
