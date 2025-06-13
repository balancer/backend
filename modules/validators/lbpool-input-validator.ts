import { z } from 'zod';
import { env } from '../../apps/env';
import { getViemClient } from '../sources/viem-client';
import { Chain } from '@prisma/client';
import { parseAbi } from 'viem';
import { CreateLbpInput } from '../../apps/api/gql/generated-schema';

// Function to check URL status (404 check)
const validateUrl = async (url: string) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
};

// Validate if contract exists on the chain
const validateContractExists = async (address: string, chain: Chain) => {
    try {
        const client = getViemClient(chain);
        const response = await client.readContract({
            address: address as `0x${string}`,
            abi: parseAbi(['function name() view returns (string)']),
            functionName: 'name',
        });
        return !!response;
    } catch {
        return false;
    }
};

export const validateLBPoolInput = async (input: CreateLbpInput) => {
    // Zod Schema for input validation
    const poolContractSchema = z
        .object({
            address: z.string().length(42),
            chain: z
                .string()
                .min(1)
                .refine(
                    (chain) => {
                        if (env.DEPLOYMENT_ENV === 'production') {
                            return chain !== 'SEPOLIA';
                        }
                        return true;
                    },
                    {
                        message: 'SEPOLIA chain is not allowed in production',
                    },
                ),
        })
        .refine((schema) => validateContractExists(schema.address, schema.chain as Chain), {
            message: "Contract doesn't exist",
        });

    const metadataSchema = z.object({
        lbpName: z.string().min(1, 'Name must be at least 1 character long'),
        description: z.string().min(1, 'Description must be at least 1 character long'),
        tokenLogo: z
            .string()
            .min(1)
            .refine((url) => validateUrl(url), { message: 'Logo URL is not accessible (404)' }),
        website: z
            .string()
            .min(1)
            .refine((url) => validateUrl(url), { message: 'Website URL is not accessible (404)' }),
        x: z.string().optional(),
        discord: z.string().optional(),
        telegram: z.string().optional(),
        farcaster: z.string().optional(),
    });

    const inputSchema = z.object({
        poolContract: poolContractSchema,
        metadata: metadataSchema,
    });

    return inputSchema.safeParseAsync(input);
};
