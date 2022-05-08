import _ from 'lodash';
import { prisma } from '../modules/util/prisma-client';

export async function prismaBulkExecuteOperations(operations: any[], chunkSize = 100) {
    const chunks = _.chunk(operations, chunkSize);

    for (const chunk of chunks) {
        await prisma.$transaction(chunk);
    }
}
