import { PrismaPromise } from '@prisma/client';
import _ from 'lodash';
import { prisma } from './prisma-client';

export async function prismaBulkExecuteOperations(
    operations: PrismaPromise<any>[],
    chunkSize = 100,
    transaction: boolean = false,
) {
    const chunks = _.chunk(operations, chunkSize);

    for (const chunk of chunks) {
        if (transaction) {
            await prisma.$transaction(chunk);
        } else {
            await Promise.all(chunk);
        }
    }
}
