import { prisma } from '../../prisma/prisma-client';
import { createIndividualDatabaseSchemaForTest } from '../tests-helper/setupTestDatabase';
import { mockServer } from '../tests-helper/mocks/mockHttpServer';
import { beetsService } from './beets.service';
import { rpcHandlers } from './mock-handlers/rpc';
import { networkContext } from '../network/network-context.service';

beforeAll(async () => {
    await createIndividualDatabaseSchemaForTest();
});

beforeEach(async () => {
    mockServer.use(...rpcHandlers);
});

afterAll(async () => {
    prisma.$disconnect();
});

test('retrieve fBeets ratio before initial sync - fails', async () => {
    let ratio;
    try {
        ratio = await beetsService.getFbeetsRatio();
    } catch (e: any) {
        expect(e.message).toBe('Fbeets data has not yet been synced');
    }
    if (!networkContext.isFantomNetwork) {
        expect(ratio).toBe('1.0');
    }

    expect.assertions(1);
});

test('sync fBeets ratio', async () => {
    if (networkContext.isFantomNetwork) {
        let fbeets;
        fbeets = await prisma.prismaFbeets.findFirst({});
        expect(fbeets).toBe(null);

        await beetsService.syncFbeetsRatio();
        fbeets = await prisma.prismaFbeets.findFirst({});
        expect(fbeets).toBeDefined();
    }
});

test('retrieve updated fBeets ratio', async () => {
    await beetsService.syncFbeetsRatio();
    const ratio = await beetsService.getFbeetsRatio();
    if (networkContext.isFantomNetwork) {
        expect(ratio).toBe('2');
    } else {
        expect(ratio).toBe('1.0');
    }
});
