import { PrismaClient } from '@prisma/client';

export let prisma = new PrismaClient();

// Debugging query times
// export let prisma = new PrismaClient({
//     log: ['query'],
// });

// prisma.$use(async (params, next) => {
//     const before = Date.now()
//     const result = await next(params)
//     const after = Date.now()
//     console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
//     return result
// })

export function setPrisma(prismaClient: PrismaClient) {
    prisma = prismaClient;
}
