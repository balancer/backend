import { prisma } from '../../../../../prisma/prisma-client';

export const update = async (params: { id: string; typeData: any }[]): Promise<void> => {
    return Promise.allSettled(
        params.map(
            ({ id, typeData }) => prisma.$executeRaw`
                UPDATE "PrismaPool"
                SET "typeData" = "typeData" || ${JSON.stringify(typeData)}::jsonb
                WHERE id = ${id};
            `,
        ),
    ).then((results) => {
        for (const result of results) {
            if (result.status === 'rejected') {
                console.error(result.reason);
            }
        }
    });
};
