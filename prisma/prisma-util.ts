import { PrismaPromise } from '@prisma/client';
import _ from 'lodash';
import { prisma } from './prisma-client';

export async function prismaBulkExecuteOperations(operations: PrismaPromise<any>[], chunkSize = 100) {
    const chunks = _.chunk(operations, chunkSize);

    for (const chunk of chunks) {
        await prisma.$transaction(chunk);
    }
}
