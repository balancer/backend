import { z } from 'zod';
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
            chain: z.string().min(1),
        })
        .refine((schema) => validateContractExists(schema.address, schema.chain as Chain), {
            message: "Contract doesn't exist",
        });

    const metadataSchema = z.object({
        name: z.string().min(1, 'Name must be at least 1 character long'),
        symbol: z.string().min(1, 'Symbol must be at least 1 character long'),
        description: z.string().min(1, 'Description must be at least 1 character long'),
        website: z
            .string()
            .min(1)
            .refine((url) => validateUrl(url), { message: 'Website URL is not accessible (404)' }),
        x: z.string().min(1),
        discord: z.string(),
        telegram: z.string(),
        farcaster: z.string(),
    });

    const saleTokenSchema = z.object({
        name: z.string().min(1),
        symbol: z.string().min(1),
        address: z.string().min(1),
        chain: z.string().min(1),
        logo: z
            .string()
            .min(1)
            .refine((url) => validateUrl(url), { message: 'Logo URL is not accessible (404)' }),
    });

    const inputSchema = z.object({
        poolContract: poolContractSchema,
        metadata: metadataSchema,
        saleToken: saleTokenSchema,
    });

    return inputSchema.safeParseAsync(input);
};
