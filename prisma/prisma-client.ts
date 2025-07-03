import { PrismaClient } from '@prisma/client';
import { env } from '../apps/env';

export let prisma = new PrismaClient({
    datasources: {
        db: {
            url: env.DATABASE_URL,
        },
    },
});

// Debugging query times
// export let prisma = new PrismaClient({
//     log: ['query'],
//     datasources: {
//         db: {
//             url: env.DATABASE_URL,
//         },
//     },
// });

// let callCount = 0;
// prisma.$use(async (params, next) => {
//     console.log(JSON.stringify(params, null, 2), callCount++);
//     // if (callCount > 8) {
//     //     throw new Error(`Maximum number of Prisma calls exceeded (${callCount}) - ${JSON.stringify(params, null, 2)}`);
//     // }
//     return next(params);
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
