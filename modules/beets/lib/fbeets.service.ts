import { prisma } from '../../../prisma/prisma-client';

export class FbeetsService {
    constructor() {}

    public async getRatio(): Promise<string> {
        const fbeets = await prisma.prismaFbeets.findFirst({});
        if (!fbeets) {
            throw new Error('Fbeets data has not yet been synced');
        }

        return fbeets.ratio;
    }
}
