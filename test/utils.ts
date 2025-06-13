import { randomBytes } from 'crypto';
import { providers } from 'ethers';
import { mainnetNetworkConfig } from '../modules/network/mainnet';
import { Token } from '@balancer/sdk';
import { PrismaPoolAndHookWithDynamic } from '../prisma/prisma-types';
import { isSameAddress } from '@balancer/sdk';
import { Address } from 'viem';
import { BufferPoolData } from '../modules/sor/utils';

// anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/7gYoDJEw6-QyVP5hd2UfZyelzDIDemGz --port 8555 --fork-block-number=17878719

// In CI we will use http://127.0.0.1:8555 to use the anvil fork;
// const httpRpc = process.env.TEST_RPC_URL || 'https://cloudflare-eth.com';
const defaultAnvilRpcUrl = 'http://127.0.0.1:8555';

export function setMainnetRpcProviderForTesting(httpRpc = defaultAnvilRpcUrl) {
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    mainnetNetworkConfig.provider = getRpcProvider(httpRpc);
}

export function getRpcProvider(httpRpc = defaultAnvilRpcUrl) {
    return new providers.JsonRpcProvider(httpRpc);
}

export function createRandomAddress() {
    return '0x' + randomBytes(20).toString('hex');
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDecimalsFromScalingFactor(scalingFactor: bigint): number {
    // Since scaling factors are used to scale up to 18 decimals,
    // if we take log10 of the scaling factor, we can determine
    // how many decimal places were added to get to 18

    // Convert scaling factor to number for math operations
    const scalingFactorNumber = Number(scalingFactor);

    // If scaling factor is 1, then the token already has 18 decimals
    if (scalingFactorNumber === 1) {
        return 18;
    }

    // Calculate log10 of scaling factor
    const log10ScalingFactor = Math.log10(scalingFactorNumber);

    // Since scaling factor = 10^(18 - tokenDecimals)
    // Then tokenDecimals = 18 - log10(scalingFactor)
    const decimals = 18 - log10ScalingFactor;

    // Return rounded number since decimals should be an integer
    return Math.round(decimals);
}

export function getTokensFromPrismaPools(
    chainId: number,
    supportedPools: PrismaPoolAndHookWithDynamic[],
    tokens: string[],
    bufferPools: BufferPoolData[],
): {
    tokenIn: Token;
    tokenOut: Token;
} {
    const prismaTokens = supportedPools.flatMap((p) =>
        p.tokens.map((t) => ({ address: t.token.address as Address, decimals: t.token.decimals })),
    );

    bufferPools.forEach((p) => {
        prismaTokens.push({ address: p.mainToken.address, decimals: p.mainToken.decimals });
        prismaTokens.push({ address: p.underlyingToken.address, decimals: p.underlyingToken.decimals });
    });

    const prismaTokenIn = prismaTokens.find((p) => isSameAddress(p.address, tokens[0] as Address))!;
    const prismaTokenOut = prismaTokens.find((p) => isSameAddress(p.address, tokens[tokens.length - 1] as Address))!;

    const tokenIn = new Token(chainId, prismaTokenIn.address, prismaTokenIn.decimals);
    const tokenOut = new Token(chainId, prismaTokenOut.address, prismaTokenOut.decimals);
    return { tokenIn, tokenOut };
}
