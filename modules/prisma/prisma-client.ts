import { PrismaClient } from '@prisma/client';

export let prisma = new PrismaClient();

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}
