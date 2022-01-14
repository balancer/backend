import { ethers } from 'ethers';
import { env } from '../../app/env';
import { SignatureLike } from '@ethersproject/bytes';
import { createLgeTypes } from './data-verification';
import { TypedDataField } from '@ethersproject/abstract-signer';
import { sanityClient } from '../sanity/sanity';
import { GqlLgeCreateInput } from '../../schema';
import { getLbpPoolOwner } from './copper-proxy';
import { getAddress } from 'ethers/lib/utils';
import { isAddressGnosisSafe } from '../gnosis/gnosis';

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
    adminAddress: string;
};

export async function createLge(input: GqlLgeCreateInput, signature: SignatureLike) {
    /*let signerAddress: string;
    try {
        signerAddress = extractSignerFromData(input, createLgeTypes, signature);
    } catch (error) {
        console.error(error);
        throw new Error('Unable to verify signature');
    }*/

    const poolOwner = await getLbpPoolOwner(getAddress(input.address));

    /*if (signerAddress !== poolOwner) {
        throw new Error(`Signer is not the pool owner`);
    }*/

    const adminIsMultisig = await isAddressGnosisSafe(getAddress(poolOwner));

    return sanityClient.create({
        _type: 'lbp',
        _id: input.id,
        id: input.id,
        address: input.address,
        name: input.name,
        websiteUrl: input.websiteUrl,
        tokenIconUrl: input.tokenIconUrl,
        bannerImageUrl: input.bannerImageUrl,
        twitterUrl: input.twitterUrl,
        mediumUrl: input.mediumUrl,
        discordUrl: input.discordUrl,
        telegramUrl: input.telegramUrl,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        tokenContractAddress: input.tokenContractAddress,
        collateralTokenAddress: input.collateralTokenAddress,
        tokenAmount: input.tokenAmount,
        collateralAmount: input.collateralAmount,
        tokenStartWeight: input.tokenStartWeight,
        collateralStartWeight: input.collateralStartWeight,
        tokenEndWeight: input.tokenEndWeight,
        collateralEndWeight: input.collateralEndWeight,
        swapFeePercentage: input.swapFeePercentage,
        adminAddress: poolOwner,
        adminIsMultisig,
        chainId: env.CHAIN_ID,
    });
}

export async function getLges() {
    return sanityClient.fetch(`*[_type == "lbp" && chainId == "${env.CHAIN_ID}"]`);
}

export async function getLge(id: string) {
    return sanityClient.fetch(`*[_type == "lbp" && chainId == "${env.CHAIN_ID}" && id == "${id}"][0]`);
}

/*export async function updateLbpEvent(lbpEvent: LbpEventUpdateInput, signature: string) {
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
}*/

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
