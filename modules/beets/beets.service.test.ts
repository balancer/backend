import { prisma } from '../../prisma/prisma-client';
import { isFantomNetwork } from '../config/network-config';
import { createSchemaForTest } from '../tests-helper/jest-test-helpers';
import { server } from '../tests-helper/mocks/server';
import { beetsService } from './beets.service';
import { rpcHandlers } from './mock-handlers/rpc';

beforeAll(async () => {
    await createSchemaForTest();
});

beforeEach(async () => {
    server.use(...rpcHandlers);
});

test('retrieve fBeets ratio before synced', async () => {
    let ratio;
    try {
        ratio = await beetsService.getFbeetsRatio();
    } catch (e: any) {
        expect(e.message).toBe('Fbeets data has not yet been synced');
    }
    if (!isFantomNetwork()) {
        expect(ratio).toBe('1.0');
    }

    expect.assertions(1);
});

test('sync fBeets ratio', async () => {
    if (isFantomNetwork()) {
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
    if (isFantomNetwork()) {
        expect(ratio).toBe('2');
    } else {
        expect(ratio).toBe('1.0');
    }
});

afterAll(async () => {
    prisma.$disconnect();
});
