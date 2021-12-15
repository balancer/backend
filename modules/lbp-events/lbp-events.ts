import { ethers } from 'ethers';
import { env } from '../../app/env';
import { SignatureLike } from '@ethersproject/bytes';
import { prisma } from '../prisma/prisma-client';
import { createLbpEventTypes, updateLbpEventTypes } from './data-verification';
import { TypedDataField } from '@ethersproject/abstract-signer';

export type LbpEventCreateInput = {
    name: string;
    description: string;
    tokenContractAddress: string;
    collateralTokenAddress: string;
    tokenAmount: string;
    collateralAmount: string;
    tokenStartWeight: number;
    collateralStartWeight: number;
    tokenEndWeight: number;
    collateralEndWeight: number;
    swapFeePercentage: number;
    poolName: string;
    poolSymbol: string;
    websiteUrl: string;
    tokenIconUrl: string;
    twitterUrl: string;
    mediumUrl: string;
    discordUrl: string;
    telegramUrl: string;
    startDate: Date;
    endDate: Date;
    adminAddresses: string[];
};

export type LbpEventUpdateInput = {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    tokenIconUrl: string;
    twitterUrl: string;
    mediumUrl: string;
    discordUrl: string;
    telegramUrl: string;
    adminAddresses: string[];
};

export async function createLbpEvent(lbpEvent: LbpEventCreateInput, signature: SignatureLike) {
    const { adminAddresses, ...eventData } = lbpEvent;

    let signerAddress: string;
    try {
        signerAddress = extractSignerFromData(lbpEvent, createLbpEventTypes, signature);
    } catch (error) {
        console.error(error);
        throw new Error('Unable to verify signature');
    }
    if (!adminAddresses.includes(signerAddress)) {
        throw new Error(`Signer is not part of the admin addresses`);
    }

    // TODO: replace with sanity
    return prisma.lbpEvent.create({
        data: {
            ...eventData,
            admins: {
                create: adminAddresses.map((address) => ({
                    admin: { connectOrCreate: { create: { address }, where: { address } } },
                    assignedBy: signerAddress,
                })),
            },
        },
        include: { admins: true },
    });
}

export async function updateLbpEvent(lbpEvent: LbpEventUpdateInput, signature: string) {
    const { adminAddresses, ...eventData } = lbpEvent;

    if (adminAddresses.length === 0) {
        throw new Error('At least 1 admin is required');
    }

    let signerAddress: string;
    try {
        signerAddress = extractSignerFromData(lbpEvent, createLbpEventTypes, signature);
    } catch (error) {
        console.error(error);
        throw new Error('Unable to verify signature');
    }

    if (!adminAddresses.includes(signerAddress)) {
        throw new Error(`Signer is not part of the admin addresses`);
    }

    const event = await prisma.lbpEvent.findUnique({
        where: { id: lbpEvent.id },
        rejectOnNotFound: true,
        include: { admins: true },
    });

    const currentAdmins = event.admins.map((admin) => admin.adminAddress);
    if (!currentAdmins.includes(signerAddress)) {
        throw new Error(`Signer is no admin of this lbp event`);
    }

    // TODO: replace with sanity

    const newAdmins = adminAddresses.filter((admin) => !currentAdmins.includes(admin));
    const removedAdmins = currentAdmins.filter((admin) => !adminAddresses.includes(admin));

    return prisma.lbpEvent.update({
        data: {
            ...eventData,
            admins: {
                create: newAdmins.map((address) => ({
                    admin: { connectOrCreate: { create: { address }, where: { address } } },
                    assignedBy: signerAddress,
                })),
                delete: removedAdmins.map((address) => ({
                    adminAddress_lbpEventId: {
                        adminAddress: address,
                        lbpEventId: lbpEvent.id,
                    },
                })),
            },
        },
        where: {
            id: eventData.id,
        },
        include: { admins: true },
    });
}

function extractSignerFromData(
    data: Record<string, any>,
    types: Record<string, Array<TypedDataField>>,
    signature: SignatureLike,
): string {
    return ethers.utils.verifyTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        types,
        data,
        signature,
    );
}
