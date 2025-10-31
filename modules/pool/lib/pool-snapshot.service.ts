import { prisma } from '../../../prisma/prisma-client';

import { GqlPoolSnapshotDataRange } from '../../../apps/api/gql/generated-schema';
import moment from 'moment-timezone';
import _ from 'lodash';
import { Chain } from '@prisma/client';
export class PoolSnapshotService {
    public async getSnapshotsForPool(poolId: string, chain: Chain, range: GqlPoolSnapshotDataRange) {
        const timestamp = this.getTimestampForRange(range);

        return prisma.prismaPoolSnapshot.findMany({
            where: { poolId, timestamp: { gt: timestamp }, chain },
            orderBy: { timestamp: 'asc' },
        });
    }

    public async getSnapshotForPool(poolId: string, timestamp: number, chain: Chain) {
        return prisma.prismaPoolSnapshot.findUnique({
            where: { id_chain: { id: `${poolId}-${timestamp}`, chain } },
        });
    }

    private getTimestampForRange(range: GqlPoolSnapshotDataRange): number {
        switch (range) {
            case 'THIRTY_DAYS':
                return moment().startOf('day').subtract(30, 'days').unix();
            case 'NINETY_DAYS':
                return moment().startOf('day').subtract(90, 'days').unix();
            case 'ONE_HUNDRED_EIGHTY_DAYS':
                return moment().startOf('day').subtract(180, 'days').unix();
            case 'ONE_YEAR':
                return moment().startOf('day').subtract(365, 'days').unix();
            case 'ALL_TIME':
                return 0;
        }
    }
}
