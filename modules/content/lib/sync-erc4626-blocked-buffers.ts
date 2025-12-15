import { prisma } from '../../../prisma/prisma-client';
import { chainIdToChain } from '../../network/chain-id-to-chain';

export const syncBlockedBuffers = async (): Promise<void> => {
    const blockedBuffers = await getBlockedBuffers();

    for (const chainId in blockedBuffers) {
        const blockedBuffersForErc4626Addresses = blockedBuffers[chainId].map((address) => address.toLowerCase());
        const chain = chainIdToChain[chainId];
        await prisma.$transaction([
            prisma.prismaToken.updateMany({
                where: {
                    chain: chain,
                },
                data: { isBufferAllowed: true },
            }),
            prisma.prismaToken.updateMany({
                where: {
                    chain: chain,
                    address: { in: blockedBuffersForErc4626Addresses },
                },
                data: { isBufferAllowed: false },
            }),
        ]);
    }
};

const ERC4626TAGS_URL =
    'https://raw.githubusercontent.com/balancer/metadata/refs/heads/main/erc4626/bufferblocklist.json';

type BufferBlocklist = {
    [chainId: string]: string[];
};

const getBlockedBuffers = async (): Promise<BufferBlocklist> => {
    const response = await fetch(ERC4626TAGS_URL);
    const bufferBlocklist = (await response.json()) as BufferBlocklist;

    return bufferBlocklist;
};
