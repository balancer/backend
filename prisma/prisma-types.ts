import { Prisma } from '@prisma/client';

const poolWithTokens = Prisma.validator<Prisma.PrismaPoolArgs>()({
    include: { tokens: true },
});

export type PrismaPoolWithTokens = Prisma.PrismaPoolGetPayload<typeof poolWithTokens>;
