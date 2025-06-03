import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchUnwrapRates } from '../../sources/contracts/v3/fetch-unwrap-rates';

/**
 * Sync erc4626 unwrap rates between wrapped/underlying
 */
export const syncErc4626UnwrapRates = async (chain: Chain) => {
    const erc4626Tokens = await prisma.prismaToken.findMany({
        where: {
            chain,
            address: { not: '0x0000000000000000000000000000000000000000' },
            types: {
                some: {
                    type: 'ERC4626',
                },
            },
        },
    });

    const underlyingTokens = await prisma.prismaToken.findMany({
        where: {
            chain,
            address: {
                in: erc4626Tokens.map((token) => token.underlyingTokenAddress).filter((address) => address !== null),
            },
        },
    });

    const underlyingTokenMap = Object.fromEntries(underlyingTokens.map((token) => [token.address, token]));

    const unwrapRates = await fetchUnwrapRates(erc4626Tokens, underlyingTokenMap);

    const operations = erc4626Tokens
        .map((token) => {
            if (unwrapRates[token.address] === token.unwrapRate) return null;

            return prisma.prismaToken.update({
                where: {
                    address_chain: {
                        address: token.address,
                        chain: chain,
                    },
                },
                data: {
                    unwrapRate: unwrapRates[token.address],
                },
            });
        })
        .filter((op): op is NonNullable<typeof op> => !!op);

    await prisma.$transaction(operations);
};
