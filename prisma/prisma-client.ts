import { PrismaClient } from '@prisma/client';

export let prisma = new PrismaClient();

export function setPrisma(prismaClient: PrismaClient) {
    prisma = prismaClient;
}
