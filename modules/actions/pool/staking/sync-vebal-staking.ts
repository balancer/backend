import { prisma } from '../../../../prisma/prisma-client';
import mainnet from '../../../../config/mainnet';

export const syncVebalStakingForPools = async (): Promise<void> => {
    const stakingId = mainnet.veBal!.address;
    const chain = 'MAINNET';
    const veBalPoolId = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';

    await prisma.prismaPoolStaking.upsert({
        where: { id_chain: { id: stakingId, chain: chain } },
        create: {
            id: stakingId,
            chain: chain,
            poolId: veBalPoolId,
            type: 'VEBAL',
            address: stakingId,
        },
        update: {},
    });

    await prisma.prismaPoolStakingVebal.upsert({
        where: { id_chain: { id: stakingId, chain: chain } },
        create: {
            id: stakingId,
            chain: chain,
            stakingId: stakingId,
            vebalAddress: stakingId,
        },
        update: {
            stakingId: stakingId,
            vebalAddress: stakingId,
        },
    });
};
