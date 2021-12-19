/*
import { createTestDb, DeepPartial, TestDatabase } from '../util/jest-test-helpers';
import { createLbpEvent, LbpEventCreateInput, LbpEventUpdateInput, updateLbpEvent } from './lbp-events';
import { ethers } from 'ethers';
import { env } from '../../app/env';
import { createLgeTypes, updateLbpEventTypes } from './data-verification';
import { merge } from 'lodash';

let db: TestDatabase;

describe('liqiuidity bootstrapping event tests', () => {
    beforeAll(async () => {
    db = await createTestDb();
}, 100000);

afterAll(async () => {
    await db.stop();
});

test('creates new lbp event if valid signature provided for the data', async () => {
    const wallet = ethers.Wallet.createRandom();
    const createLbpEventInput: LbpEventCreateInput = aLbpEventCreateInput({ adminAddresses: [wallet.address] });
    const signature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        createLgeTypes,
        createLbpEventInput,
    );
    const { adminAddresses, ...expectedEvent } = createLbpEventInput;
    const { admins, ...event } = await createLbpEvent(createLbpEventInput, signature);
    expect(event).toMatchObject(expectedEvent);
    expect(admins.map((admin) => admin.adminAddress).sort()).toEqual(adminAddresses.sort());
});

test('rejects creation of lbp event with invalid signature', async () => {
    const wallet = ethers.Wallet.createRandom();
    const createLbpEventInput = aLbpEventCreateInput({ adminAddresses: [wallet.address] });
    const signature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        createLgeTypes,
        createLbpEventInput,
    );
    return expect(createLbpEvent(createLbpEventInput, signature + '123')).rejects.toThrow();
});

test('rejects creation of lbp event if signer is not part of the admin list', async () => {
    const wallet = ethers.Wallet.createRandom();
    const createLbpEventInput = aLbpEventCreateInput();
    const signature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        createLgeTypes,
        createLbpEventInput,
    );
    return expect(createLbpEvent(createLbpEventInput, signature)).rejects.toMatchObject(
        new Error('Signer is not part of the admin addresses'),
    );
});

test('updates lbp event if valid signature provided for the data', async () => {
    const wallet = ethers.Wallet.createRandom();

    const createLbpEventInput: LbpEventCreateInput = aLbpEventCreateInput({ adminAddresses: [wallet.address] });
    const createSignature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        createLgeTypes,
        createLbpEventInput,
    );

    const { id, admins } = await createLbpEvent(createLbpEventInput, createSignature);

    // we add another wallet as admin
    const anotherWallet = ethers.Wallet.createRandom();
    const adminAddresses: string[] = [...admins.map((admin) => admin.adminAddress), anotherWallet.address];

    const updateLbpEventInput: LbpEventUpdateInput = aLbpEventUpdateInput({
        id,
        adminAddresses,
    });

    const updateSignature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        updateLbpEventTypes,
        updateLbpEventInput,
    );

    const updatedEvent = await updateLbpEvent(updateLbpEventInput, updateSignature);
    expect(updatedEvent.name).toEqual(updateLbpEventInput.name);
    expect(updatedEvent.description).toEqual(updateLbpEventInput.description);
    expect(updatedEvent.admins.map((admin) => admin.adminAddress).sort()).toEqual(adminAddresses.sort());
});
});

test('allows removal of admin from lbp event', async () => {
    const wallet = ethers.Wallet.createRandom();
    const anotherWallet = ethers.Wallet.createRandom();

    const createLbpEventInput: LbpEventCreateInput = aLbpEventCreateInput({
        adminAddresses: [wallet.address, anotherWallet.address],
    });
    const createSignature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        createLgeTypes,
        createLbpEventInput,
    );

    const event = await createLbpEvent(createLbpEventInput, createSignature);

    const adminAddresses: string[] = [anotherWallet.address];

    const updateLbpEventInput: LbpEventUpdateInput = aLbpEventUpdateInput({
        ...event,
        adminAddresses,
    });

    const updateSignature = await anotherWallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        updateLbpEventTypes,
        updateLbpEventInput,
    );

    const updatedEvent = await updateLbpEvent(updateLbpEventInput, updateSignature);
    expect(updatedEvent.admins.map((admin) => admin.adminAddress).sort()).toEqual(adminAddresses.sort());
});

test('allows re-adding of admin from lbp event', async () => {
    const wallet = ethers.Wallet.createRandom();
    const anotherWallet = ethers.Wallet.createRandom();

    const createLbpEventInput: LbpEventCreateInput = aLbpEventCreateInput({
        adminAddresses: [wallet.address, anotherWallet.address],
    });
    const createSignature = await wallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        createLgeTypes,
        createLbpEventInput,
    );

    const event = await createLbpEvent(createLbpEventInput, createSignature);

    const adminAddressesAfterFirstUpdate: string[] = [anotherWallet.address];

    const updateLbpEventInput: LbpEventUpdateInput = aLbpEventUpdateInput({
        ...event,
        adminAddresses: adminAddressesAfterFirstUpdate,
    });

    const updateSignature = await anotherWallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        updateLbpEventTypes,
        updateLbpEventInput,
    );

    const updatedEvent = await updateLbpEvent(updateLbpEventInput, updateSignature);

    const adminAddressesAfterFinalUpdate: string[] = [wallet.address, anotherWallet.address];

    const finalUpdateLbpEventInput: LbpEventUpdateInput = aLbpEventUpdateInput({
        ...updatedEvent,
        adminAddresses: adminAddressesAfterFinalUpdate,
    });

    const finalSignature = await anotherWallet._signTypedData(
        { name: 'beethovenx', version: '1', chainId: env.CHAIN_ID },
        updateLbpEventTypes,
        finalUpdateLbpEventInput,
    );

    const finalEvent = await updateLbpEvent(finalUpdateLbpEventInput, finalSignature);

    expect(finalEvent.admins.map((admin) => admin.adminAddress).sort()).toEqual(adminAddressesAfterFinalUpdate.sort());
});

function aLbpEventCreateInput(lbpCreateInput?: DeepPartial<LbpEventCreateInput>): LbpEventCreateInput {
    const createLbpEventInput: LbpEventCreateInput = {
        name: 'test proj',
        description: 'descr',
        tokenIconUrl: 'https://icon.com',
        tokenContractAddress: '0xMyToken',
        collateralTokenAddress: '0xCollateralToken',
        tokenAmount: '1000',
        collateralAmount: '500',
        collateralStartWeight: 90,
        collateralEndWeight: 10,
        swapFeePercentage: '0.1',
        tokenStartWeight: 10,
        tokenEndWeight: 90,
        poolName: 'testpool',
        poolSymbol: 'TP',
        websiteUrl: 'http://test.com',
        telegramUrl: 'https://telegram',
        twitterUrl: 'https://twitter',
        discordUrl: 'https://discord',
        mediumUrl: 'https://medium',
        adminAddresses: [],
        startDate: new Date(),
        endDate: new Date(),
    };
    return merge(createLbpEventInput, lbpCreateInput);
}

function aLbpEventUpdateInput(
    lbpEventUpdateInput?: DeepPartial<LbpEventUpdateInput> & { id: string },
): LbpEventUpdateInput {
    const defaultValues = {
        id: 'some-id',
        name: 'new name',
        description: 'new description',
        tokenIconUrl: 'https://newTokenurl',
        websiteUrl: 'https://newWebsiteUrl',
        telegramUrl: 'https://newTelegram',
        twitterUrl: 'https://newTwitter',
        discordUrl: 'https://newDiscord',
        mediumUrl: 'https://newMedium',
        adminAddresses: [],
    };
    return merge(defaultValues, lbpEventUpdateInput);
}
*/
